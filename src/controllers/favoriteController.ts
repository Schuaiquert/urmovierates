import { Request, Response, NextFunction } from 'express';
import { favoriteService } from '../services/favoriteService';

export class FavoriteController {
  async getUserFavorites(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId || req.query.userId as string;
      const result = await favoriteService.findByUser(userId, {
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
      const { movieId } = req.body;
      const userId = req.body.userId || req.params.userId;
      const result = await favoriteService.create(userId, movieId);
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { movieId } = req.params;
      const userId = req.params.userId || req.body.userId;
      const result = await favoriteService.delete(userId, movieId);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      const { movieId } = req.params;
      const userId = req.body.userId || req.params.userId;
      const result = await favoriteService.toggle(userId, movieId);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query.userId as string;
      const movieIds = req.query.movieIds as string;
      if (!userId || !movieIds) {
        return res.status(400).json({ error: 'userId and movieIds are required' });
      }
      const ids = movieIds.split(',');
      const result = await favoriteService.getStatus(userId, ids);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const favoriteController = new FavoriteController();