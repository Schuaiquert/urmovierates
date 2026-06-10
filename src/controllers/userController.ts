import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';

export class UserController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.findAll({
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.findById(Number(req.params.id));
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
