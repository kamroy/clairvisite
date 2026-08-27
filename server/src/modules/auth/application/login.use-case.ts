import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepositoryPort } from '../../users/domain/user.repository.port';
import { PASSWORD_HASHER, PasswordHasherPort } from './password-hasher.port';
import { SESSION_TOKEN_ISSUER, SessionTokenIssuerPort } from './session-token-issuer.port';

// Message stable consommé par le client pour distinguer ce cas d'un 401 générique et
// proposer un renvoi de l'email de vérification (voir client/src/lib/api.js).
export const EMAIL_NOT_VERIFIED_MESSAGE = 'EMAIL_NOT_VERIFIED';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(SESSION_TOKEN_ISSUER) private readonly tokens: SessionTokenIssuerPort,
  ) {}

  async execute(email: string, password: string): Promise<{ user: { id: string; email: string }; sessionToken: string }> {
    const user = await this.users.findByEmail(email);
    if (!user?.passwordHash) throw new UnauthorizedException('Identifiants invalides');

    const valid = await this.hasher.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');

    // Vérifié seulement une fois le mot de passe confirmé : on ne révèle jamais ce statut
    // à quelqu'un qui ne connaît pas déjà le mot de passe du compte.
    if (!user.emailVerifiedAt) throw new ForbiddenException(EMAIL_NOT_VERIFIED_MESSAGE);

    const sessionToken = this.tokens.issue({ sub: user.id, role: user.role, email: user.email });
    return { user: { id: user.id, email: user.email }, sessionToken };
  }
}
