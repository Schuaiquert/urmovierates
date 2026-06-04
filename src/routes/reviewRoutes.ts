import { Router } from 'express';
import { reviewController } from '../controllers/reviewController';
import { reviewValidators, validate } from '../middlewares/validators';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         text:
 *           type: string
 *         userId:
 *           type: string
 *         movieId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateReview:
 *       type: object
 *       required: [rating, movieId]
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         text:
 *           type: string
 *         movieId:
 *           type: string
 *     ReviewStats:
 *       type: object
 *       properties:
 *         average:
 *           type: number
 *         count:
 *           type: integer
 */

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: List all reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: movieId
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of reviews
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReview'
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Validation error or already reviewed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 */
router.get('/', reviewController.getAll.bind(reviewController));
router.post(
  '/',
  authenticate,
  reviewValidators.create,
  validate,
  reviewController.create.bind(reviewController)
);

/**
 * @swagger
 * /api/reviews/movies/{movieId}/stats:
 *   get:
 *     summary: Get review stats for a movie
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Movie review statistics
 */
router.get('/movies/:movieId/stats', reviewValidators.getByMovie, validate, reviewController.getMovieStats.bind(reviewController));

/**
 * @swagger
 * /api/reviews/movies/{movieId}:
 *   get:
 *     summary: Get all reviews for a movie
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of movie reviews
 */
router.get('/movies/:movieId', reviewValidators.getByMovie, validate, reviewController.getByMovie.bind(reviewController));

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Review found
 *       404:
 *         description: Review not found
 *   put:
 *     summary: Update review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReview'
 *     responses:
 *       200:
 *         description: Review updated
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         $ref: '#/components/schemas/Forbidden'
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Review deleted
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         $ref: '#/components/schemas/Forbidden'
 */
router.get('/:id', reviewValidators.getById, validate, reviewController.getById.bind(reviewController));
router.put(
  '/:id',
  authenticate,
  requireRole('USER', 'ADMIN'),
  reviewValidators.update,
  validate,
  reviewController.update.bind(reviewController)
);
router.delete(
  '/:id',
  authenticate,
  requireRole('USER', 'ADMIN'),
  reviewValidators.delete,
  validate,
  reviewController.delete.bind(reviewController)
);

export default router;
