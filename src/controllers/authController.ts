import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AppError } from '../middlewares/errorHandler';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const user = await authService.register({ email, password, name });
      res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      const user = await authService.me(req.userId);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      const user = await authService.updateMe(req.userId, req.body);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError('Authentication required', 401, 'AUTH_MISSING');
      await authService.deleteMe(req.userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
