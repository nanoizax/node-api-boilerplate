import { Router } from 'express';
import type { UserController } from '../controllers/UserController.js';
import { authenticate, requireRole } from '../middlewares/authenticate.js';
import { validate } from '../validators/validate.js';
import { updateUserSchema } from '../validators/userValidators.js';

export function createUserRouter(controller: UserController): Router {
  const router = Router();

  /**
   * @openapi
   * /users/me:
   *   get:
   *     tags: [Users]
   *     summary: Get current authenticated user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile
   *       401:
   *         description: Unauthorized
   */
  router.get('/me', authenticate, controller.getMe);

  /**
   * @openapi
   * /users/me:
   *   put:
   *     tags: [Users]
   *     summary: Update current user profile
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               email: { type: string, format: email }
   *               password: { type: string }
   *     responses:
   *       200:
   *         description: Updated user
   */
  router.put('/me', authenticate, validate(updateUserSchema), (req, res) => {
    req.params.id = (req as typeof req & { user: { id: string } }).user.id;
    return controller.update(req, res);
  });

  /**
   * @openapi
   * /users:
   *   get:
   *     tags: [Users]
   *     summary: List users (admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: role
   *         schema: { type: string, enum: [admin, user] }
   *       - in: query
   *         name: isActive
   *         schema: { type: boolean }
   *     responses:
   *       200:
   *         description: Paginated user list
   */
  router.get('/', authenticate, requireRole('admin'), controller.list);

  /**
   * @openapi
   * /users/{id}:
   *   get:
   *     tags: [Users]
   *     summary: Get user by ID (admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: User data
   *       404:
   *         description: User not found
   */
  router.get('/:id', authenticate, requireRole('admin'), controller.getById);

  /**
   * @openapi
   * /users/{id}:
   *   put:
   *     tags: [Users]
   *     summary: Update user (admin or own user)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Updated user
   */
  router.put('/:id', authenticate, validate(updateUserSchema), controller.update);

  /**
   * @openapi
   * /users/{id}:
   *   delete:
   *     tags: [Users]
   *     summary: Delete user (admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: User deleted
   *       404:
   *         description: User not found
   */
  router.delete('/:id', authenticate, requireRole('admin'), controller.remove);

  return router;
}
