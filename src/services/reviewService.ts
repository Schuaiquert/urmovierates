import prisma from '../config/database';
import { CreateReviewDTO, UpdateReviewDTO, PaginationQuery } from '../types';
import { AppError } from '../middlewares/errorHandler';

export class ReviewService {
  async findAll(query: PaginationQuery & { movieId?: string; userId?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.movieId) where.movieId = query.movieId;
    if (query.userId) where.userId = query.userId;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, role: true } }, movie: { select: { id: true, title: true } } },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new AppError('Review not found', 404);
    return review;
  }

  async findByUserAndMovie(userId: string, movieId: string) {
    return prisma.review.findUnique({ where: { userId_movieId: { userId, movieId } } });
  }

  async create(data: CreateReviewDTO) {
    return prisma.review.create({ data });
  }

  async update(id: string, data: UpdateReviewDTO) {
    await this.findById(id);
    return prisma.review.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findById(id);
    return prisma.review.delete({ where: { id } });
  }

  async getMovieStats(movieId: string) {
    const reviews = await prisma.review.findMany({ where: { movieId }, select: { rating: true } });
    if (reviews.length === 0) return { average: 0, count: 0 };

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { average: Number((sum / reviews.length).toFixed(1)), count: reviews.length };
  }
}

export const reviewService = new ReviewService();