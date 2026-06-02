import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { PaginationQuery } from '../types';

export class FavoriteService {
  async findByUser(userId: string, query: PaginationQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 12));
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          movie: {
            select: {
              id: true,
              title: true,
              synopsis: true,
              year: true,
              poster: true,
              trailer: true,
              active: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      data: favorites.map(f => f.movie),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findByUserAndMovie(userId: string, movieId: string) {
    return prisma.favorite.findUnique({
      where: { userId_movieId: { userId, movieId } },
    });
  }

  async create(userId: string, movieId: string) {
    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) throw new AppError('Movie not found', 404);
    if (!movie.active) throw new AppError('Cannot favorite inactive movie', 400);

    const existing = await this.findByUserAndMovie(userId, movieId);
    if (existing) throw new AppError('Already favorited', 409);

    await prisma.favorite.create({ data: { userId, movieId } });
    return { favorited: true };
  }

  async delete(userId: string, movieId: string) {
    const favorite = await this.findByUserAndMovie(userId, movieId);
    if (!favorite) throw new AppError('Favorite not found', 404);

    await prisma.favorite.delete({ where: { id: favorite.id } });
    return { favorited: false };
  }

  async toggle(userId: string, movieId: string) {
    const existing = await this.findByUserAndMovie(userId, movieId);
    if (existing) {
      await this.delete(userId, movieId);
      return { favorited: false };
    } else {
      await this.create(userId, movieId);
      return { favorited: true };
    }
  }

  async getStatus(userId: string, movieIds: string[]) {
    if (!userId || movieIds.length === 0) {
      return movieIds.reduce((acc, id) => ({ ...acc, [id]: false }), {});
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId, movieId: { in: movieIds } },
      select: { movieId: true },
    });

    return movieIds.reduce((acc, id) => ({
      ...acc,
      [id]: favorites.some(f => f.movieId === id),
    }), {});
  }
}

export const favoriteService = new FavoriteService();