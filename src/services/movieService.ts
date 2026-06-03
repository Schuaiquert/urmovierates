import prisma from '../config/database';
import { CreateMovieDTO, UpdateMovieDTO, PaginationQuery } from '../types';
import { AppError } from '../middlewares/errorHandler';

export class MovieService {
  async findAll(query: PaginationQuery & { active?: boolean; year?: number; genre?: string; search?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 12));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.active !== undefined) where.active = query.active;
    if (query.year) where.year = query.year;
    if (query.genre) {
      where.genres = {
        some: {
          genre: { name: { equals: query.genre, mode: 'insensitive' } }
        }
      };
    }
    if (query.search) {
      const term = String(query.search).trim();
      if (term) {
        where.OR = [
          { title: { contains: term, mode: 'insensitive' } },
          { synopsis: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    const [movies, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          genres: { include: { genre: { select: { id: true, name: true } } } }
        }
      }),
      prisma.movie.count({ where }),
    ]);

    return {
      data: movies.map(m => ({
        ...m,
        genres: m.genres.map(g => g.genre)
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        genres: { include: { genre: { select: { id: true, name: true } } } }
      }
    });
    if (!movie) throw new AppError('Movie not found', 404);
    return {
      ...movie,
      genres: movie.genres.map(g => g.genre)
    };
  }

  async create(data: CreateMovieDTO & { genres?: string[] }) {
    const { genres: genreNames, ...movieData } = data;
    const movie = await prisma.movie.create({
      data: movieData,
      include: {
        genres: { include: { genre: true } }
      }
    });

    if (genreNames && genreNames.length > 0) {
      for (const genreName of genreNames) {
        let genre = await prisma.genre.findUnique({ where: { name: genreName } });
        if (!genre) {
          genre = await prisma.genre.create({ data: { name: genreName } });
        }
        await prisma.movieGenre.create({ data: { movieId: movie.id, genreId: genre.id } });
      }
    }

    return this.findById(movie.id);
  }

  async update(id: string, data: UpdateMovieDTO & { genres?: string[] }) {
    await this.findById(id);
    const { genres: genreNames, ...movieData } = data;

    if (genreNames !== undefined) {
      await prisma.movieGenre.deleteMany({ where: { movieId: id } });
      if (genreNames.length > 0) {
        for (const genreName of genreNames) {
          let genre = await prisma.genre.findUnique({ where: { name: genreName } });
          if (!genre) {
            genre = await prisma.genre.create({ data: { name: genreName } });
          }
          await prisma.movieGenre.create({ data: { movieId: id, genreId: genre.id } });
        }
      }
    }

    return prisma.movie.update({
      where: { id },
      data: movieData,
      include: { genres: { include: { genre: true } } }
    }).then(m => ({
      ...m,
      genres: m.genres.map(g => g.genre)
    }));
  }

  async delete(id: string) {
    await this.findById(id);
    return prisma.movie.delete({ where: { id } });
  }

  async getDistinctYears() {
    const years = await prisma.movie.findMany({
      where: { active: true },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' }
    });
    return years.map(y => y.year);
  }

  async getAllGenres() {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' }
    });
    return genres;
  }

  async createGenre(name: string) {
    return prisma.genre.create({ data: { name } });
  }
}

export const movieService = new MovieService();