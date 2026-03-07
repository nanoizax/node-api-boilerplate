import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUser } from '../../../src/application/use-cases/auth/RegisterUser.js';
import type { IUserRepository } from '../../../src/domain/repositories/IUserRepository.js';
import { AppError } from '../../../src/shared/errors/AppError.js';

const mockUserRepository: IUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe('RegisterUser', () => {
  let registerUser: RegisterUser;

  beforeEach(() => {
    vi.clearAllMocks();
    registerUser = new RegisterUser(mockUserRepository);
  });

  it('creates a user when email is not taken', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUserRepository.create).mockResolvedValue({
      id: 'uuid-123',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed',
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await registerUser.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Secret123',
    });

    expect(result.email).toBe('john@example.com');
    expect(result).not.toHaveProperty('passwordHash');
    expect(mockUserRepository.create).toHaveBeenCalledOnce();
  });

  it('throws conflict when email already exists', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
      id: 'uuid-123',
      name: 'Existing',
      email: 'john@example.com',
      passwordHash: 'hashed',
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      registerUser.execute({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Secret123',
      }),
    ).rejects.toThrow(AppError);

    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });

  it('stores hashed password, not plain text', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUserRepository.create).mockImplementation(async (input) => ({
      id: 'uuid-123',
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role ?? 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await registerUser.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Secret123',
    });

    const [createCall] = vi.mocked(mockUserRepository.create).mock.calls;
    expect(createCall[0].passwordHash).not.toBe('Secret123');
    expect(createCall[0].passwordHash).toMatch(/^\$2b\$/);
  });
});
