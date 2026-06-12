import prisma from '../config/database';
import { CreateReviewDTO, UpdateReviewDTO, PaginationQuery } from '../types';
import { AppError } from '../middlewares/errorHandler';

type Viewer = { userId: number; role: 'USER' | 'ADMIN' } | null;

/**
 * Decide se um registro deve aparecer para o viewer.
 * - Não-deletados: sempre visíveis.
 * - Deletados: visíveis APENAS para o autor.
 */
function isVisibleTo(
  review: { isDeleted: boolean; userId: number },
  viewer: Viewer,
): boolean {
  if (!review.isDeleted) return true;
  if (!viewer) return false;
  return viewer.userId === review.userId;
}

export class ReviewService {
  async findAll(
    query: PaginationQuery & { movieId?: number; userId?: number },
    viewer: Viewer = null,
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (query.movieId) where.movieId = query.movieId;
    if (query.userId) where.userId = query.userId;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, role: true } },
          movie: { select: { id: true, title: true } },
          deletedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: number, viewer: Viewer = null) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, role: true } },
        deletedBy: { select: { id: true, name: true } },
      },
    });
    if (!review) throw new AppError('Review not found', 404);
    if (!isVisibleTo(review, viewer)) {
      throw new AppError('Review not found', 404);
    }
    return review;
  }

  async findByUserAndMovie(userId: number, movieId: number) {
    return prisma.review.findFirst({ where: { userId, movieId } });
  }

  async create(data: CreateReviewDTO) {
    return prisma.review.create({ data });
  }

  async update(id: number, data: UpdateReviewDTO) {
    await this.findById(id);
    return prisma.review.update({ where: { id }, data });
  }

  /**
   * Soft delete unificado: usado tanto pelo autor removendo o
   * próprio quanto pelo admin removendo de terceiro. Decisão
   * confirmada: NÃO há caminho de hard delete.
   */
  async softDelete(id: number, deletedById: number, reason: string) {
    return prisma.review.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById,
        deletionReason: reason,
      },
    });
  }

  async getByMovie(
    movieId: number,
    viewer: Viewer = null,
  ) {
    // Carrega TODAS as reviews (incluindo deletadas) para depois
    // filtrar as que o viewer tem direito de ver. Mais simples que
    // duas queries; reviews por filme são poucas.
    const all = await prisma.review.findMany({
      where: { movieId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
        deletedBy: { select: { id: true, name: true } },
      },
    });
    return all.filter((r) => isVisibleTo(r, viewer));
  }

  async getMovieStats(movieId: number) {
    const reviews = await prisma.review.findMany({
      where: { movieId, isDeleted: false },
      select: { rating: true },
    });
    if (reviews.length === 0) return { average: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: Number((sum / reviews.length).toFixed(1)),
      count: reviews.length,
    };
  }
}

export const reviewService = new ReviewService();
