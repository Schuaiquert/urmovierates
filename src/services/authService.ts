import prisma from '../config/database';
import bcrypt from 'bcrypt';
import { AppError } from '../middlewares/errorHandler';
import {
  generateTokenPair,
  verifyRefreshToken,
  JsonWebTokenError,
  TokenExpiredError,
  AccessTokenPayload,
} from '../utils/jwt';
import { generateSecureToken } from '../utils/crypto';
import { RegisterDTO, LoginDTO, AuthResponse, ForgotPasswordResponse, UpdateMeDTO } from '../types';

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MINUTES = 15;

export class AuthService {
  private detectAdminRole(email: string): 'ADMIN' | 'USER' {
    const localPart = email.split('@')[0];
    return localPart.startsWith('adm') ? 'ADMIN' : 'USER';
  }

  async register(data: RegisterDTO): Promise<Omit<AuthResponse['user'], 'id'>> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already registered', 409, 'EMAIL_TAKEN');

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
    if (!user) throw new AppError('essa conta não existe', 401, 'INVALID_CREDENTIALS');

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) throw new AppError('senha incorreta', 401, 'INVALID_CREDENTIALS');

    const payload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const { accessToken, refreshToken } = generateTokenPair(payload);

    return {
      accessToken,
      refreshToken,
      token: accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    let payload: AccessTokenPayload;
    try {
      const decoded = verifyRefreshToken(refreshToken);
      payload = { userId: decoded.userId, email: decoded.email, role: decoded.role };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new AppError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
      }
      if (error instanceof JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401, 'REFRESH_TOKEN_INVALID');
      }
      throw new AppError('Refresh failed', 401, 'REFRESH_FAILED');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new AppError('User not found', 401, 'USER_NOT_FOUND');

    const freshPayload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const { accessToken, refreshToken: newRefresh } = generateTokenPair(freshPayload);

    return {
      accessToken,
      refreshToken: newRefresh,
      token: accessToken,
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

    if (!resetToken) throw new AppError('Invalid reset token', 400, 'RESET_TOKEN_INVALID');
    if (resetToken.used) throw new AppError('Token already used', 400, 'RESET_TOKEN_USED');
    if (resetToken.expiresAt < new Date()) throw new AppError('Token expired', 400, 'RESET_TOKEN_EXPIRED');

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } }),
    ]);
  }

  async me(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return user;
  }

  async updateMe(userId: number, data: UpdateMeDTO) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    if (data.email && data.email !== existing.email) {
      const dup = await prisma.user.findUnique({ where: { email: data.email } });
      if (dup) throw new AppError('Email already in use', 409, 'EMAIL_TAKEN');
    }

    const update: { name?: string; email?: string; password?: string } = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.email !== undefined) update.email = data.email;
    if (data.password !== undefined) update.password = await bcrypt.hash(data.password, SALT_ROUNDS);

    return prisma.user.update({
      where: { id: userId },
      data: update,
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  async deleteMe(userId: number): Promise<void> {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  }
}

export const authService = new AuthService();
