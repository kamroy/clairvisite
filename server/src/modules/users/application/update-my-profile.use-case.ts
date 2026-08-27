import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../domain/user.repository.port';

export interface UpdateMyProfileInput {
  phone: string;
}

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort) {}

  async execute(userId: string, input: UpdateMyProfileInput) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    return this.users.updateProfile(userId, { phone: input.phone });
  }
}
