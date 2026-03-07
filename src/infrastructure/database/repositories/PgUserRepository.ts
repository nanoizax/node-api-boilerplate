import type { Pool } from 'pg';
import type { IUserRepository, CreateUserInput, UpdateUserInput, UserFilters, PaginatedUsers } from '../../../domain/repositories/IUserRepository.js';
import type { User } from '../../../domain/entities/User.js';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PgUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? toUser(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ? toUser(result.rows[0]) : null;
  }

  async findAll(filters: UserFilters): Promise<PaginatedUsers> {
    const { page = 1, limit = 20, role, isActive } = filters;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (role !== undefined) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }
    if (isActive !== undefined) {
      params.push(isActive);
      conditions.push(`is_active = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users ${where}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const dataResult = await this.pool.query<UserRow>(
      `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return {
      data: dataResult.rows.map(toUser),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(input: CreateUserInput): Promise<User> {
    const result = await this.pool.query<UserRow>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.name, input.email, input.passwordHash, input.role ?? 'user'],
    );
    return toUser(result.rows[0]);
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) {
      params.push(input.name);
      fields.push(`name = $${params.length}`);
    }
    if (input.email !== undefined) {
      params.push(input.email);
      fields.push(`email = $${params.length}`);
    }
    if (input.passwordHash !== undefined) {
      params.push(input.passwordHash);
      fields.push(`password_hash = $${params.length}`);
    }
    if (input.role !== undefined) {
      params.push(input.role);
      fields.push(`role = $${params.length}`);
    }
    if (input.isActive !== undefined) {
      params.push(input.isActive);
      fields.push(`is_active = $${params.length}`);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const result = await this.pool.query<UserRow>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );

    return result.rows[0] ? toUser(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
