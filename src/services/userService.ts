import prisma from '../config/database';
import { PaginationQuery } from '../types';
import { AppError } from '../middlewares/errorHandler';

export class UserService {
  async findAll(query: PaginationQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return user;
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }
}

export const userService = new UserService();
