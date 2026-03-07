import bcrypt from 'bcrypt';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.js';
import type { UserPublic } from '../../../domain/entities/User.js';
import { toPublicUser } from '../../../domain/entities/User.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { TokenService } from '../../../infrastructure/services/TokenService.js';

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}

export class LoginUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.userRepository.findByEmail(input.email.toLowerCase().trim());
    if (!user) {
      throw AppError.unauthorized('Invalid credentials');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account is disabled');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatch) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { token: refreshToken, expiresAt } = this.tokenService.generateRefreshToken();

    await this.refreshTokenRepository.create(user.id, refreshToken, expiresAt);

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    };
  }
}
