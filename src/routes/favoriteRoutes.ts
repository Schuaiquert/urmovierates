import { Router } from 'express';
import { favoriteController } from '../controllers/favoriteController';
import { validate } from '../middlewares/validators';
import { body, param, query } from 'express-validator';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Favorite:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         movieId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get user favorites
 *     tags: [Favorites]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of favorite movies
 */
router.get(
  '/',
  [query('userId').isUUID().withMessage('Valid userId is required')],
  validate,
  favoriteController.getUserFavorites.bind(favoriteController)
);

/**
 * @swagger
 * /api/favorites/status:
 *   get:
 *     summary: Get favorite status for multiple movies
 *     tags: [Favorites]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: movieIds
 *         required: true
 *         schema: { type: string }
 *         description: Comma-separated movie IDs
 *     responses:
 *       200:
 *         description: Map of movieId to favorite status
 */
router.get(
  '/status',
  [
    query('userId').isUUID().withMessage('Valid userId is required'),
    query('movieIds').notEmpty().withMessage('movieIds is required'),
  ],
  validate,
  favoriteController.getStatus.bind(favoriteController)
);

/**
 * @swagger
 * /api/favorites/{movieId}:
 *   post:
 *     summary: Add movie to favorites
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Movie added to favorites
 *       409:
 *         description: Already favorited
 */
router.post(
  '/:movieId',
  [
    param('movieId').notEmpty().withMessage('movieId is required'),
    body('userId').isUUID().withMessage('Valid userId is required'),
  ],
  validate,
  favoriteController.add.bind(favoriteController)
);

/**
 * @swagger
 * /api/favorites/{movieId}:
 *   delete:
 *     summary: Remove movie from favorites
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Movie removed from favorites
 *       404:
 *         description: Favorite not found
 */
router.delete(
  '/:movieId',
  [
    param('movieId').notEmpty().withMessage('movieId is required'),
    query('userId').isUUID().withMessage('Valid userId is required'),
  ],
  validate,
  favoriteController.remove.bind(favoriteController)
);

/**
 * @swagger
 * /api/favorites/{movieId}/toggle:
 *   post:
 *     summary: Toggle favorite status
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Toggle result with favorited status
 */
router.post(
  '/:movieId/toggle',
  [
    param('movieId').notEmpty().withMessage('movieId is required'),
    body('userId').isUUID().withMessage('Valid userId is required'),
  ],
  validate,
  favoriteController.toggle.bind(favoriteController)
);

export default router;