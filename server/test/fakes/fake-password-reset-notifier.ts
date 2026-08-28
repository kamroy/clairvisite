import { PasswordResetNotifierPort } from '../../src/modules/auth/application/ports/password-reset-notifier.port';

// Remplace ResendPasswordResetNotifier dans les tests : aucun appel réseau à Resend.
// Capture la dernière URL envoyée pour permettre aux tests d'extraire le jeton et de
// simuler le clic sur le lien reçu par email.
export class FakePasswordResetNotifier implements PasswordResetNotifierPort {
  lastResetUrl: string | null = null;

  async sendPasswordResetEmail(_user: { email: string; fullName: string }, resetUrl: string): Promise<void> {
    this.lastResetUrl = resetUrl;
  }

  extractToken(): string {
    if (!this.lastResetUrl) throw new Error('FakePasswordResetNotifier: no email sent yet');
    return new URL(this.lastResetUrl).searchParams.get('token')!;
  }
}
