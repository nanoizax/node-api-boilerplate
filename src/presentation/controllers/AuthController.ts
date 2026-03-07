import type { Request, Response } from 'express';
import type { RegisterUser } from '../../application/use-cases/auth/RegisterUser.js';
import type { LoginUser } from '../../application/use-cases/auth/LoginUser.js';
import type { RefreshTokens } from '../../application/use-cases/auth/RefreshTokens.js';
import type { LogoutUser } from '../../application/use-cases/auth/LogoutUser.js';

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: LoginUser,
    private readonly refreshTokens: RefreshTokens,
    private readonly logoutUser: LogoutUser,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const user = await this.registerUser.execute(req.body);
    res.status(201).json({ success: true, data: user });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.loginUser.execute(req.body);
    res.json({ success: true, data: result });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    const tokens = await this.refreshTokens.execute(refreshToken);
    res.json({ success: true, data: tokens });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    await this.logoutUser.execute(refreshToken);
    res.json({ success: true, message: 'Logged out successfully' });
  };
}
