import bcrypt from 'bcrypt';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { UserPublic } from '../../../domain/entities/User.js';
import { toPublicUser } from '../../../domain/entities/User.js';
import { AppError } from '../../../shared/errors/AppError.js';

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
}

export class UpdateUser {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string, input: UpdateUserInput): Promise<UserPublic> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    if (input.email && input.email !== user.email) {
      const existing = await this.userRepository.findByEmail(input.email);
      if (existing) {
        throw AppError.conflict('Email already in use');
      }
    }

    const updateData: Parameters<typeof this.userRepository.update>[1] = {};
    if (input.name) updateData.name = input.name;
    if (input.email) updateData.email = input.email.toLowerCase().trim();
    if (input.password) updateData.passwordHash = await bcrypt.hash(input.password, 12);

    const updated = await this.userRepository.update(id, updateData);
    if (!updated) {
      throw AppError.notFound('User not found');
    }

    return toPublicUser(updated);
  }
}
