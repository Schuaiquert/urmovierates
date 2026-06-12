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
  updateMe: [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('email').optional().trim().isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  getById: [param('id').notEmpty().withMessage('User ID is required')],
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
    body('movieId').isInt({ min: 1 }).withMessage('movieId must be a positive integer'),
  ],
  update: [
    param('id').isInt({ min: 1 }).withMessage('Invalid review ID'),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('text').optional().trim().isLength({ max: 1000 }),
    // Defesa em profundidade: body não pode trazer campos de moderação.
    body('isDeleted').not().exists().withMessage('isDeleted is not allowed'),
    body('deletedById').not().exists().withMessage('deletedById is not allowed'),
    body('deletedAt').not().exists().withMessage('deletedAt is not allowed'),
    body('deletionReason').not().exists().withMessage('deletionReason is not allowed'),
    body('userId').not().exists().withMessage('userId is not allowed'),
    body('movieId').not().exists().withMessage('movieId is not allowed'),
  ],
  getById: [param('id').isInt({ min: 1 }).withMessage('Invalid review ID')],
  delete: [
    param('id').isInt({ min: 1 }).withMessage('Invalid review ID'),
    body('reason')
      .exists({ checkFalsy: true })
      .withMessage('reason is required')
      .bail()
      .isString()
      .withMessage('reason must be a string')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('reason cannot be empty')
      .bail()
      .isLength({ max: 500 })
      .withMessage('reason must be at most 500 characters'),
  ],
  getByMovie: [param('movieId').isInt({ min: 1 }).withMessage('movieId must be a positive integer')],
};