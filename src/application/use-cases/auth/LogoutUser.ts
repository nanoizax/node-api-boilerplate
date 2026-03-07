import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.js';
import { AppError } from '../../../shared/errors/AppError.js';

export class LogoutUser {
  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(refreshToken: string): Promise<void> {
    const deleted = await this.refreshTokenRepository.deleteByToken(refreshToken);
    if (!deleted) {
      throw AppError.badRequest('Invalid token');
    }
  }
}
