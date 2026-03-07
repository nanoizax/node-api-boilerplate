import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { TokenService } from '../../../infrastructure/services/TokenService.js';

export interface RefreshTokensOutput {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokens {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(token: string): Promise<RefreshTokensOutput> {
    const stored = await this.refreshTokenRepository.findByToken(token);
    if (!stored) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      await this.refreshTokenRepository.deleteByToken(token);
      throw AppError.unauthorized('Refresh token expired');
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User not found or disabled');
    }

    await this.refreshTokenRepository.deleteByToken(token);

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { token: newRefreshToken, expiresAt } = this.tokenService.generateRefreshToken();
    await this.refreshTokenRepository.create(user.id, newRefreshToken, expiresAt);

    return { accessToken, refreshToken: newRefreshToken };
  }
}
