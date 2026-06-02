import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { CreateUserDTO, UpdateUserDTO } from '../types';

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
      const user = await userService.findById(req.params.id);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateUserDTO = req.body;
      const user = await userService.create(data);
      res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data: UpdateUserDTO = req.body;
      const user = await userService.update(req.params.id, data);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();