import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createAuthRouter } from '../../../src/presentation/routes/authRoutes.js';
import { AuthController } from '../../../src/presentation/controllers/AuthController.js';
import { errorHandler } from '../../../src/presentation/middlewares/errorHandler.js';
import type { RegisterUser } from '../../../src/application/use-cases/auth/RegisterUser.js';
import type { LoginUser } from '../../../src/application/use-cases/auth/LoginUser.js';
import type { RefreshTokens } from '../../../src/application/use-cases/auth/RefreshTokens.js';
import type { LogoutUser } from '../../../src/application/use-cases/auth/LogoutUser.js';
import { AppError } from '../../../src/shared/errors/AppError.js';

const mockRegisterUser = { execute: vi.fn() } as unknown as RegisterUser;
const mockLoginUser = { execute: vi.fn() } as unknown as LoginUser;
const mockRefreshTokens = { execute: vi.fn() } as unknown as RefreshTokens;
const mockLogoutUser = { execute: vi.fn() } as unknown as LogoutUser;

let app: express.Express;

beforeAll(() => {
  const controller = new AuthController(
    mockRegisterUser,
    mockLoginUser,
    mockRefreshTokens,
    mockLogoutUser,
  );

  app = express();
  app.use(express.json());
  app.use('/auth', createAuthRouter(controller));
  app.use(errorHandler);
});

describe('POST /auth/register', () => {
  it('returns 201 on successful registration', async () => {
    vi.mocked(mockRegisterUser.execute).mockResolvedValue({
      id: 'uuid-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      isActive: true,
      createdAt: new Date(),
    });

    const res = await request(app).post('/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Secret123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('john@example.com');
  });

  it('returns 422 on invalid body', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'not-an-email',
      password: 'short',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 409 when email is taken', async () => {
    vi.mocked(mockRegisterUser.execute).mockRejectedValue(AppError.conflict('Email already in use'));

    const res = await request(app).post('/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Secret123',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /auth/login', () => {
  it('returns tokens on valid credentials', async () => {
    vi.mocked(mockLoginUser.execute).mockResolvedValue({
      user: { id: 'uuid-123', name: 'John', email: 'john@example.com', role: 'user', isActive: true, createdAt: new Date() },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const res = await request(app).post('/auth/login').send({
      email: 'john@example.com',
      password: 'Secret123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('returns 401 on invalid credentials', async () => {
    vi.mocked(mockLoginUser.execute).mockRejectedValue(AppError.unauthorized('Invalid credentials'));

    const res = await request(app).post('/auth/login').send({
      email: 'john@example.com',
      password: 'WrongPass',
    });

    expect(res.status).toBe(401);
  });
});
