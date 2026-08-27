import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { USER_REPOSITORY, UserRepositoryPort } from '../../users/domain/user.repository.port';
import { PASSWORD_HASHER, PasswordHasherPort } from './password-hasher.port';
import { EMAIL_VERIFICATION_NOTIFIER, EmailVerificationNotifierPort } from './ports/email-verification-notifier.port';
import { EMAIL_VERIFICATION_TOKEN_TTL_MS } from './email-verification.constants';
import { Role } from '../../users/domain/user.entity';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: Role;
}

@Injectable()
export class RegisterUseCase {
  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(EMAIL_VERIFICATION_NOTIFIER) private readonly notifier: EmailVerificationNotifierPort,
  ) {}

  // Ne délivre plus de session à l'inscription : le compte doit d'abord être confirmé
  // via le lien envoyé par email (voir VerifyEmailUseCase), sans quoi n'importe qui
  // pourrait créer un compte avec l'adresse email de quelqu'un d'autre.
  async execute(input: RegisterInput, verifyBaseUrl: string): Promise<{ user: { id: string; email: string } }> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new ConflictException('Email déjà utilisé');

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      role: input.role ?? 'acheteur',
      authProvider: 'password',
      passwordHash,
    });

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);
    await this.users.setEmailVerificationToken(user.id, { tokenHash, expiresAt });

    const verificationUrl = `${verifyBaseUrl}?token=${rawToken}`;
    this.notifier
      .sendVerificationEmail(user, verificationUrl)
      .catch((err) => this.logger.error("Échec envoi de l'email de vérification", err));

    return { user: { id: user.id, email: user.email } };
  }
}
