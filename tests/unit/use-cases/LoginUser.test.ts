import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { LoginUser } from '../../../src/application/use-cases/auth/LoginUser.js';
import type { IUserRepository } from '../../../src/domain/repositories/IUserRepository.js';
import type { IRefreshTokenRepository } from '../../../src/domain/repositories/IRefreshTokenRepository.js';
import { TokenService } from '../../../src/infrastructure/services/TokenService.js';
import { AppError } from '../../../src/shared/errors/AppError.js';
import type { User } from '../../../src/domain/entities/User.js';

const makeUser = async (overrides: Partial<User> = {}): Promise<User> => ({
  id: 'uuid-123',
  name: 'John Doe',
  email: 'john@example.com',
  passwordHash: await bcrypt.hash('Secret123', 10),
  role: 'user',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockUserRepository: IUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockRefreshTokenRepository: IRefreshTokenRepository = {
  create: vi.fn(),
  findByToken: vi.fn(),
  deleteByToken: vi.fn(),
  deleteAllByUserId: vi.fn(),
  deleteExpired: vi.fn(),
};

describe('LoginUser', () => {
  let loginUser: LoginUser;
  const tokenService = new TokenService();

  beforeEach(() => {
    vi.clearAllMocks();
    loginUser = new LoginUser(mockUserRepository, mockRefreshTokenRepository, tokenService);
  });

  it('returns tokens on valid credentials', async () => {
    const user = await makeUser();
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
    vi.mocked(mockRefreshTokenRepository.create).mockResolvedValue({
      id: 'rt-id',
      userId: user.id,
      token: 'refresh-token',
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    const result = await loginUser.execute({ email: 'john@example.com', password: 'Secret123' });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.user.email).toBe('john@example.com');
  });

  it('throws unauthorized on wrong password', async () => {
    const user = await makeUser();
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

    await expect(
      loginUser.execute({ email: 'john@example.com', password: 'WrongPass' }),
    ).rejects.toThrow(AppError);
  });

  it('throws unauthorized when user not found', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

    await expect(
      loginUser.execute({ email: 'nobody@example.com', password: 'Secret123' }),
    ).rejects.toThrow(AppError);
  });

  it('throws forbidden when user is inactive', async () => {
    const user = await makeUser({ isActive: false });
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);

    await expect(
      loginUser.execute({ email: 'john@example.com', password: 'Secret123' }),
    ).rejects.toThrow(AppError);
  });
});
