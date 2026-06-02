import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

export const userValidators = {
  create: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Role must be USER or ADMIN'),
  ],
  update: [
    param('id').notEmpty().withMessage('User ID is required'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('email').optional().trim().isEmail(),
    body('password').optional().isLength({ min: 6 }),
    body('role').optional().isIn(['USER', 'ADMIN']),
  ],
  getById: [param('id').notEmpty().withMessage('User ID is required')],
  delete: [param('id').notEmpty().withMessage('User ID is required')],
};

export const movieValidators = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
    body('year').isInt({ min: 1888, max: 2100 }).withMessage('Year must be between 1888 and 2100'),
    body('synopsis').optional().trim().isLength({ max: 2000 }),
    body('poster').optional().trim().isURL(),
    body('trailer').optional().trim().isURL(),
    body('active').optional().isBoolean(),
  ],
  update: [
    param('id').notEmpty().withMessage('Movie ID is required'),
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('year').optional().isInt({ min: 1888, max: 2100 }),
    body('synopsis').optional().trim().isLength({ max: 2000 }),
    body('poster').optional().trim().isURL(),
    body('trailer').optional().trim().isURL(),
    body('active').optional().isBoolean(),
  ],
  getById: [param('id').notEmpty().withMessage('Movie ID is required')],
  delete: [param('id').notEmpty().withMessage('Movie ID is required')],
};

export const reviewValidators = {
  create: [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('text').optional().trim().isLength({ max: 1000 }),
    body('userId').isUUID().withMessage('Valid userId is required'),
    body('movieId').notEmpty().withMessage('movieId is required'),
  ],
  update: [
    param('id').isUUID().withMessage('Invalid review ID'),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('text').optional().trim().isLength({ max: 1000 }),
  ],
  getById: [param('id').isUUID().withMessage('Invalid review ID')],
  delete: [param('id').isUUID().withMessage('Invalid review ID')],
  getByMovie: [param('movieId').notEmpty().withMessage('movieId is required')],
};