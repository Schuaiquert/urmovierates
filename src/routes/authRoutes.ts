import { Router } from 'express';
import { authController } from '../controllers/authController';
import { userValidators, validate } from '../middlewares/validators';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - apiKeyAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *   put:
 *     summary: Update the authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - apiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Updated user profile
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete the authenticated user's account
 *     tags: [Auth]
 *     security:
 *       - apiKeyAuth: []
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Account deleted
 *       401:
 *         $ref: '#/components/schemas/Unauthorized'
 */
router.get('/me', authenticate, authController.me.bind(authController));
router.put(
  '/me',
  authenticate,
  userValidators.updateMe,
  validate,
  authController.updateMe.bind(authController)
);
router.delete('/me', authenticate, authController.deleteMe.bind(authController));

export default router;
