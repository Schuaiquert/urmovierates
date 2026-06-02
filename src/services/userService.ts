import prisma from '../config/database';
import { CreateUserDTO, UpdateUserDTO, PaginationQuery } from '../types';
import { AppError } from '../middlewares/errorHandler';
import bcrypt from 'bcrypt';

export class UserService {
  async findAll(query: PaginationQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserDTO) {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new AppError('Email already in use', 409);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: { ...data, password: hashedPassword },
    });
  }

  async update(id: string, data: UpdateUserDTO) {
    await this.findById(id);

    if (data.email) {
      const existing = await this.findByEmail(data.email);
      if (existing && existing.id !== id) throw new AppError('Email already in use', 409);
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return prisma.user.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findById(id);
    return prisma.user.delete({ where: { id } });
  }
}

export const userService = new UserService();