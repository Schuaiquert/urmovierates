import { Router } from 'express';
import { movieController } from '../controllers/movieController';
import { movieValidators, validate } from '../middlewares/validators';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Movie:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         synopsis:
 *           type: string
 *         year:
 *           type: integer
 *         poster:
 *           type: string
 *         trailer:
 *           type: string
 *         genre:
 *           type: string
 *         duration:
 *           type: integer
 *         active:
 *           type: boolean
 *         genres:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Genre'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Genre:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *     CreateMovie:
 *       type: object
 *       required: [title, year]
 *       properties:
 *         title:
 *           type: string
 *         year:
 *           type: integer
 *         synopsis:
 *           type: string
 *         poster:
 *           type: string
 *         trailer:
 *           type: string
 *         genre:
 *           type: string
 *         duration:
 *           type: integer
 *         genreIds:
 *           type: array
 *           items:
 *             type: string
 *         active:
 *           type: boolean
 */

/**
 * @swagger
 * /api/movies:
 *   get:
 *     summary: List all movies
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: genre
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of movies
 *   post:
 *     summary: Create a new movie
 *     tags: [Movies]
 *     security:
 *       - apiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMovie'
 *     responses:
 *       201:
 *         description: Movie created
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         $ref: '#/components/schemas/Forbidden'
 */
router.get('/', movieController.getAll.bind(movieController));
router.post('/', authenticate, requireRole('ADMIN'), movieValidators.create, validate, movieController.create.bind(movieController));

/**
 * @swagger
 * /api/movies/years:
 *   get:
 *     summary: Get distinct years with movies
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: List of years
 */
router.get('/years', movieController.getYears.bind(movieController));

/**
 * @swagger
 * /api/movies/genres:
 *   get:
 *     summary: Get all genres
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: List of genres
 */
router.get('/genres', movieController.getGenres.bind(movieController));

/**
 * @swagger
 * /api/movies/genres:
 *   post:
 *     summary: Create a new genre
 *     tags: [Movies]
 *     security:
 *       - apiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Genre created
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         $ref: '#/components/schemas/Forbidden'
 */
router.post('/genres', authenticate, requireRole('ADMIN'), movieController.createGenre.bind(movieController));

/**
 * @swagger
 * /api/movies/{id}:
 *   get:
 *     summary: Get movie by ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Movie found
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update movie
 *     tags: [Movies]
 *     security:
 *       - apiKeyAuth: []
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
 *             $ref: '#/components/schemas/CreateMovie'
 *     responses:
 *       200:
 *         description: Movie updated
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         $ref: '#/components/schemas/Forbidden'
 *   delete:
 *     summary: Delete movie
 *     tags: [Movies]
 *     security:
 *       - apiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Movie deleted
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       403:
 *         $ref: '#/components/schemas/Forbidden'
 */
router.get('/:id', movieValidators.getById, validate, movieController.getById.bind(movieController));
router.put('/:id', authenticate, requireRole('ADMIN'), movieValidators.update, validate, movieController.update.bind(movieController));
router.delete('/:id', authenticate, requireRole('ADMIN'), movieValidators.delete, validate, movieController.delete.bind(movieController));

export default router;