import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { UserPublic } from '../../../domain/entities/User.js';
import { toPublicUser } from '../../../domain/entities/User.js';
import { AppError } from '../../../shared/errors/AppError.js';

export class GetUserById {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<UserPublic> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return toPublicUser(user);
  }
}
