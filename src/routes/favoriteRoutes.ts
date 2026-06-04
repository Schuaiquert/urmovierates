import { Router } from 'express';
import { favoriteController } from '../controllers/favoriteController';
import { authenticate } from '../middlewares/authMiddleware';
import { body, param, query } from 'express-validator';
import { validate } from '../middlewares/validators';

const router = Router();

router.use(authenticate);

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
 *     summary: Get the authenticated user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of favorite movies
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  favoriteController.getUserFavorites.bind(favoriteController)
);

/**
 * @swagger
 * /api/favorites/status:
 *   get:
 *     summary: Get favorite status for multiple movies for the authenticated user
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: movieIds
 *         required: true
 *         schema: { type: string }
 *         description: Comma-separated movie IDs
 *     responses:
 *       200:
 *         description: Map of movieId to favorite status
 *       400:
 *         description: movieIds is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 */
router.get(
  '/status',
  [query('movieIds').notEmpty().withMessage('movieIds is required'), validate],
  favoriteController.getStatus.bind(favoriteController)
);

/**
 * @swagger
 * /api/favorites/{movieId}:
 *   post:
 *     summary: Add movie to authenticated user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Movie added to favorites
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       409:
 *         description: Already favorited
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:movieId',
  [param('movieId').notEmpty().withMessage('movieId is required'), validate],
  favoriteController.add.bind(favoriteController)
);

/**
 * @swagger
 * /api/favorites/{movieId}:
 *   delete:
 *     summary: Remove movie from authenticated user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Movie removed from favorites
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       404:
 *         description: Favorite not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:movieId',
  [param('movieId').notEmpty().withMessage('movieId is required'), validate],
  favoriteController.remove.bind(favoriteController)
);

/**
 * @swagger
 * /api/favorites/{movieId}/toggle:
 *   post:
 *     summary: Toggle favorite status for the authenticated user
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Toggle result with favorited status
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 */
router.post(
  '/:movieId/toggle',
  [param('movieId').notEmpty().withMessage('movieId is required'), validate],
  favoriteController.toggle.bind(favoriteController)
);

export default router;
