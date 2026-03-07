import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { AppError } from '../../../shared/errors/AppError.js';

export class DeleteUser {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw AppError.notFound('User not found');
    }
  }
}
