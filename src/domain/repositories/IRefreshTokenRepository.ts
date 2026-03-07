import type { RefreshToken } from '../entities/RefreshToken.js';

export interface IRefreshTokenRepository {
  create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken>;
  findByToken(token: string): Promise<RefreshToken | null>;
  deleteByToken(token: string): Promise<boolean>;
  deleteAllByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
