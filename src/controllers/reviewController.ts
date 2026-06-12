import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/reviewService';
import { AppError } from '../middlewares/errorHandler';
import { CreateReviewDTO, UpdateReviewDTO } from '../types';

type Viewer = { userId: number; role: 'USER' | 'ADMIN' };

function viewerFromReq(req: Request): Viewer | null {
  if (!req.user) return null;
  return { userId: req.user.userId, role: req.user.role as Viewer['role'] };
}

export class ReviewController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reviewService.findAll(
        {
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 10,
          movieId: req.query.movieId ? Number(req.query.movieId) : undefined,
          userId: req.query.userId ? Number(req.query.userId) : undefined,
        },
        viewerFromReq(req),
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.findById(
        Number(req.params.id),
        viewerFromReq(req),
      );
      res.json({ data: review });
    } catch (error) {
      next(error);
    }
  }

  async getByMovie(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.getByMovie(
        Number(req.params.movieId),
        viewerFromReq(req),
      );
      res.json({ data: reviews });
    } catch (error) {
      next(error);
    }
  }

  async getMovieStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await reviewService.getMovieStats(
        Number(req.params.movieId),
      );
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
        movieId: Number(req.body.movieId),
        userId: req.userId,
      };
      const review = await reviewService.create(data);
      res.status(201).json({ data: review });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Editar comentário.
   * - Apenas o autor pode editar (admin NÃO edita comentários de outros).
   * - Apenas `rating` e `text` são mutáveis.
   * - `isDeleted`/`deletedById`/`deletedAt`/`deletionReason` JAMAIS
   *   vêm do body.
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      }
      const id = Number(req.params.id);
      const existing = await reviewService.findById(id, viewerFromReq(req));

      if (existing.userId !== req.user.userId) {
        throw new AppError(
          'Only the author can edit a review',
          403,
          'FORBIDDEN_NOT_AUTHOR',
        );
      }
      if (existing.isDeleted) {
        throw new AppError(
          'Cannot edit a removed review',
          409,
          'REVIEW_REMOVED',
        );
      }

      // Defesa em profundidade: ignora qualquer campo sensível do body.
      const safeBody = { ...req.body };
      delete safeBody.isDeleted;
      delete safeBody.deletedById;
      delete safeBody.deletedAt;
      delete safeBody.deletionReason;
      delete safeBody.userId;
      delete safeBody.movieId;

      const data: UpdateReviewDTO = safeBody;
      const review = await reviewService.update(id, data);
      res.json({ data: review });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Excluir comentário.
   * - Autor pode excluir o próprio; admin pode excluir qualquer um.
   * - **Sempre soft delete** com auditoria (decisão confirmada).
   * - `reason` é obrigatório; validado também aqui em caso de bypass
   *   do express-validator.
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      }
      const id = Number(req.params.id);
      const existing = await reviewService.findById(id, {
        userId: req.user.userId,
        role: 'ADMIN', // bypass do filtro isDeleted=true
      });
      if (!existing) {
        throw new AppError('Review not found', 404, 'NOT_FOUND');
      }

      const isAdmin = req.user.role === 'ADMIN';
      const isAuthor = existing.userId === req.user.userId;

      if (!isAdmin && !isAuthor) {
        throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
      }

      // `reason` é garantido pelo validator, mas defendemos aqui.
      const reason = typeof req.body?.reason === 'string'
        ? req.body.reason.trim()
        : '';
      if (!reason) {
        throw new AppError(
          'Deletion reason is required',
          400,
          'REASON_REQUIRED',
        );
      }

      // Soft delete unificado (autor OU admin) — sem hardDelete.
      await reviewService.softDelete(id, req.user.userId, reason);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
