import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/reviewService';
import { AppError } from '../middlewares/errorHandler';
import { CreateReviewDTO, UpdateReviewDTO } from '../types';

export class ReviewController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reviewService.findAll({
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        movieId: req.query.movieId as string,
        userId: req.query.userId as string,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.findById(req.params.id);
      res.json({ data: review });
    } catch (error) {
      next(error);
    }
  }

  async getByMovie(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reviewService.findAll({
        page: 1,
        limit: 100,
        movieId: req.params.movieId,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMovieStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await reviewService.getMovieStats(req.params.movieId);
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      }
      const data: CreateReviewDTO = {
        rating: Number(req.body.rating),
        text: req.body.text,
        movieId: req.body.movieId,
        userId: req.userId,
      };
      const review = await reviewService.create(data);
      res.status(201).json({ data: review });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      }
      const existing = await reviewService.findById(req.params.id);
      if (req.user.role !== 'ADMIN' && existing.userId !== req.user.userId) {
        throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
      }
      const data: UpdateReviewDTO = req.body;
      const review = await reviewService.update(req.params.id, data);
      res.json({ data: review });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      }
      const existing = await reviewService.findById(req.params.id);
      if (req.user.role !== 'ADMIN' && existing.userId !== req.user.userId) {
        throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
      }
      await reviewService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
