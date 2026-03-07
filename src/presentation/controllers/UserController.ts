import type { Request, Response } from 'express';
import type { GetUsers } from '../../application/use-cases/user/GetUsers.js';
import type { GetUserById } from '../../application/use-cases/user/GetUserById.js';
import type { UpdateUser } from '../../application/use-cases/user/UpdateUser.js';
import type { DeleteUser } from '../../application/use-cases/user/DeleteUser.js';
import type { AuthenticatedRequest } from '../middlewares/authenticate.js';
import { AppError } from '../../shared/errors/AppError.js';

export class UserController {
  constructor(
    private readonly getUsers: GetUsers,
    private readonly getUserById: GetUserById,
    private readonly updateUser: UpdateUser,
    private readonly deleteUser: DeleteUser,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, role, isActive } = req.query as Record<string, string>;
    const result = await this.getUsers.execute({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      role: role as 'admin' | 'user' | undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    res.json({ success: true, data: result });
  };

  getMe = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const user = await this.getUserById.execute(authReq.user.id);
    res.json({ success: true, data: user });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const user = await this.getUserById.execute(req.params.id);
    res.json({ success: true, data: user });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const targetId = req.params.id;

    if (authReq.user.role !== 'admin' && authReq.user.id !== targetId) {
      throw AppError.forbidden('Cannot update another user');
    }

    const user = await this.updateUser.execute(targetId, req.body);
    res.json({ success: true, data: user });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.deleteUser.execute(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  };
}
