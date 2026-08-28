import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { USER_REPOSITORY, UserRepositoryPort } from '../../users/domain/user.repository.port';
import { PASSWORD_RESET_NOTIFIER, PasswordResetNotifierPort } from './ports/password-reset-notifier.port';
import { PASSWORD_RESET_TOKEN_TTL_MS } from './password-reset.constants';

@Injectable()
export class RequestPasswordResetUseCase {
  private readonly logger = new Logger(RequestPasswordResetUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_RESET_NOTIFIER) private readonly notifier: PasswordResetNotifierPort,
  ) {}

  // Ne révèle jamais si l'email existe ou est un compte Google (qui n'a pas de mot de
  // passe à réinitialiser) — la réponse HTTP est identique dans tous les cas
  // (anti-enumeration, même principe que ResendVerificationEmailUseCase).
  async execute(email: string, resetBaseUrl: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || user.authProvider !== 'password') return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
    await this.users.setPasswordResetToken(user.id, { tokenHash, expiresAt });

    const resetUrl = `${resetBaseUrl}?token=${rawToken}`;
    this.notifier
      .sendPasswordResetEmail(user, resetUrl)
      .catch((err) => this.logger.error("Échec envoi de l'email de réinitialisation", err));
  }
}
