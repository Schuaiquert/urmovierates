import prisma from '../config/database';
import bcrypt from 'bcrypt';
import { AppError } from '../middlewares/errorHandler';
import { generateToken, verifyToken, JwtPayload } from '../utils/jwt';
import { generateSecureToken } from '../utils/crypto';
import { RegisterDTO, LoginDTO, AuthResponse, ForgotPasswordResponse } from '../types';

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MINUTES = 15;

export class AuthService {
  private detectAdminRole(email: string): 'ADMIN' | 'USER' {
    const localPart = email.split('@')[0];
    return localPart.startsWith('adm') ? 'ADMIN' : 'USER';
  }

  async register(data: RegisterDTO): Promise<Omit<AuthResponse['user'], 'id'>> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already registered', 409);

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const role = this.detectAdminRole(data.email);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name || data.email.split('@')[0],
        role,
      },
    });

    return { email: user.email, name: user.name, role: user.role };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError('essa conta não existe', 401);

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) throw new AppError('senha incorreta', 401);

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    if (process.env.NODE_ENV === 'development') {
      return { message: 'Password reset token generated', token };
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken) throw new AppError('Invalid reset token', 400);
    if (resetToken.used) throw new AppError('Token already used', 400);
    if (resetToken.expiresAt < new Date()) throw new AppError('Token expired', 400);

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } }),
    ]);
  }

  getUserFromToken(token: string): JwtPayload {
    try {
      return verifyToken(token);
    } catch {
      throw new AppError('Invalid or expired token', 401);
    }
  }
}

export const authService = new AuthService();