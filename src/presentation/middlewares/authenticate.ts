import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { TokenService } from '../../infrastructure/services/TokenService.js';
import type { UserRole } from '../../domain/entities/User.js';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

const tokenService = new TokenService();

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);
  try {
    const payload = tokenService.verifyAccessToken(token);
    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    throw AppError.unauthorized('Invalid or expired access token');
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      throw AppError.forbidden('Insufficient permissions');
    }
    next();
  };
}
