import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { USER_REPOSITORY, UserRepositoryPort } from '../../users/domain/user.repository.port';
import { SESSION_TOKEN_ISSUER, SessionTokenIssuerPort } from './session-token-issuer.port';

export class InvalidOrExpiredVerificationTokenError extends Error {
  constructor() {
    super('Lien de vérification invalide ou expiré');
  }
}

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(SESSION_TOKEN_ISSUER) private readonly tokens: SessionTokenIssuerPort,
  ) {}

  async execute(rawToken: string): Promise<string> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const user = await this.users.findByEmailVerificationTokenHash(tokenHash);

    const expiresAt = user?.emailVerificationTokenExpiresAt;
    if (!user || !expiresAt || expiresAt < new Date()) {
      throw new InvalidOrExpiredVerificationTokenError();
    }

    const verified = await this.users.markEmailVerified(user.id);
    return this.tokens.issue({ sub: verified.id, role: verified.role, email: verified.email });
  }
}
