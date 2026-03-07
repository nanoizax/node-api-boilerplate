import { describe, it, expect } from 'vitest';
import { toPublicUser } from '../../../src/domain/entities/User.js';
import type { User } from '../../../src/domain/entities/User.js';

describe('toPublicUser', () => {
  const user: User = {
    id: 'uuid-123',
    name: 'John Doe',
    email: 'john@example.com',
    passwordHash: '$2b$12$hashed',
    role: 'user',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  it('strips passwordHash from user', () => {
    const publicUser = toPublicUser(user);
    expect(publicUser).not.toHaveProperty('passwordHash');
  });

  it('keeps all public fields', () => {
    const publicUser = toPublicUser(user);
    expect(publicUser.id).toBe(user.id);
    expect(publicUser.name).toBe(user.name);
    expect(publicUser.email).toBe(user.email);
    expect(publicUser.role).toBe(user.role);
    expect(publicUser.isActive).toBe(user.isActive);
    expect(publicUser.createdAt).toBe(user.createdAt);
  });
});
