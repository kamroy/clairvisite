import { EmailVerificationNotifierPort } from '../../src/modules/auth/application/ports/email-verification-notifier.port';

// Remplace ResendEmailVerificationNotifier dans les tests : aucun appel réseau à Resend.
// Capture la dernière URL envoyée pour permettre aux tests d'extraire le jeton et de
// simuler le clic sur le lien reçu par email.
export class FakeEmailVerificationNotifier implements EmailVerificationNotifierPort {
  lastVerificationUrl: string | null = null;

  async sendVerificationEmail(_user: { email: string; fullName: string }, verificationUrl: string): Promise<void> {
    this.lastVerificationUrl = verificationUrl;
  }

  extractToken(): string {
    if (!this.lastVerificationUrl) throw new Error('FakeEmailVerificationNotifier: no email sent yet');
    return new URL(this.lastVerificationUrl).searchParams.get('token')!;
  }
}
