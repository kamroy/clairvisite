import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { USER_REPOSITORY, UserRepositoryPort } from '../../users/domain/user.repository.port';
import { PASSWORD_HASHER, PasswordHasherPort } from './password-hasher.port';

export class InvalidOrExpiredResetTokenError extends Error {
  constructor() {
    super('Lien de réinitialisation invalide ou expiré');
  }
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
  ) {}

  async execute(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const user = await this.users.findByPasswordResetTokenHash(tokenHash);

    const expiresAt = user?.passwordResetTokenExpiresAt;
    if (!user || !expiresAt || expiresAt < new Date()) {
      throw new InvalidOrExpiredResetTokenError();
    }

    const passwordHash = await this.hasher.hash(newPassword);
    await this.users.resetPassword(user.id, passwordHash);
  }
}
