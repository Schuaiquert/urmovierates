import { Request, Response, NextFunction } from 'express';
import { movieService } from '../services/movieService';
import { CreateMovieDTO, UpdateMovieDTO } from '../types';

export class MovieController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await movieService.findAll({
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 12,
        active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        genre: req.query.genre as string || undefined,
        search: req.query.search as string || undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const movie = await movieService.findById(Number(req.params.id));
      res.json({ data: movie });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateMovieDTO = req.body;
      const movie = await movieService.create(data);
      res.status(201).json({ data: movie });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data: UpdateMovieDTO = req.body;
      const movie = await movieService.update(Number(req.params.id), data);
      res.json({ data: movie });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await movieService.delete(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getYears(req: Request, res: Response, next: NextFunction) {
    try {
      const years = await movieService.getDistinctYears();
      res.json({ data: years });
    } catch (error) {
      next(error);
    }
  }

  async getGenres(req: Request, res: Response, next: NextFunction) {
    try {
      const genres = await movieService.getAllGenres();
      res.json({ data: genres });
    } catch (error) {
      next(error);
    }
  }

  async createGenre(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const genre = await movieService.createGenre(name);
      res.status(201).json({ data: genre });
    } catch (error) {
      next(error);
    }
  }
}

export const movieController = new MovieController();