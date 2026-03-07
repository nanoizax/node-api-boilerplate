import type { Pool } from 'pg';
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.js';
import type { RefreshToken } from '../../../domain/entities/RefreshToken.js';

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

function toRefreshToken(row: RefreshTokenRow): RefreshToken {
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export class PgRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly pool: Pool) {}

  async create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    const result = await this.pool.query<RefreshTokenRow>(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [userId, token, expiresAt],
    );
    return toRefreshToken(result.rows[0]);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const result = await this.pool.query<RefreshTokenRow>(
      'SELECT * FROM refresh_tokens WHERE token = $1',
      [token],
    );
    return result.rows[0] ? toRefreshToken(result.rows[0]) : null;
  }

  async deleteByToken(token: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  }

  async deleteExpired(): Promise<void> {
    await this.pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
  }
}
