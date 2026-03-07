import bcrypt from 'bcrypt';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { UserPublic } from '../../../domain/entities/User.js';
import { toPublicUser } from '../../../domain/entities/User.js';
import { AppError } from '../../../shared/errors/AppError.js';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export class RegisterUser {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterUserInput): Promise<UserPublic> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict('Email already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await this.userRepository.create({
      name: input.name,
      email: input.email.toLowerCase().trim(),
      passwordHash,
      role: 'user',
    });

    return toPublicUser(user);
  }
}
