import { Request, Response, NextFunction } from 'express';
import { favoriteService } from '../services/favoriteService';
import { AppError } from '../middlewares/errorHandler';

export class FavoriteController {
  async getUserFavorites(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      const result = await favoriteService.findByUser(req.userId, {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 12,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async add(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      const movieId = req.params.movieId;
      const result = await favoriteService.create(req.userId, movieId);
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      const movieId = req.params.movieId;
      const result = await favoriteService.delete(req.userId, movieId);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      const movieId = req.params.movieId;
      const result = await favoriteService.toggle(req.userId, movieId);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      const movieIds = req.query.movieIds as string;
      if (!movieIds) {
        return res.status(400).json({ error: 'movieIds is required', code: 'VALIDATION_ERROR' });
      }
      const ids = movieIds.split(',').filter(Boolean);
      const result = await favoriteService.getStatus(req.userId, ids);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const favoriteController = new FavoriteController();
