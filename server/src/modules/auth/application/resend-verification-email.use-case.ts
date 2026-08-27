import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { USER_REPOSITORY, UserRepositoryPort } from '../../users/domain/user.repository.port';
import { EMAIL_VERIFICATION_NOTIFIER, EmailVerificationNotifierPort } from './ports/email-verification-notifier.port';
import { EMAIL_VERIFICATION_TOKEN_TTL_MS } from './email-verification.constants';

@Injectable()
export class ResendVerificationEmailUseCase {
  private readonly logger = new Logger(ResendVerificationEmailUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(EMAIL_VERIFICATION_NOTIFIER) private readonly notifier: EmailVerificationNotifierPort,
  ) {}

  // Ne révèle jamais si l'email existe, est déjà vérifié, ou est un compte Google —
  // la réponse HTTP est identique dans tous les cas (anti-enumeration).
  async execute(email: string, verifyBaseUrl: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || user.emailVerifiedAt || user.authProvider !== 'password') return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);
    await this.users.setEmailVerificationToken(user.id, { tokenHash, expiresAt });

    const verificationUrl = `${verifyBaseUrl}?token=${rawToken}`;
    this.notifier
      .sendVerificationEmail(user, verificationUrl)
      .catch((err) => this.logger.error("Échec envoi de l'email de vérification", err));
  }
}
