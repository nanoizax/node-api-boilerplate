import type { IUserRepository, UserFilters, PaginatedUsers } from '../../../domain/repositories/IUserRepository.js';

export class GetUsers {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(filters: UserFilters): Promise<PaginatedUsers> {
    return this.userRepository.findAll({
      page: filters.page ?? 1,
      limit: Math.min(filters.limit ?? 20, 100),
      role: filters.role,
      isActive: filters.isActive,
    });
  }
}
