import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PasswordResetNotifierPort } from '../../application/ports/password-reset-notifier.port';

@Injectable()
export class ResendPasswordResetNotifier implements PasswordResetNotifierPort {
  private readonly resend: Resend;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'));
  }

  async sendPasswordResetEmail(user: { email: string; fullName: string }, resetUrl: string): Promise<void> {
    await this.resend.emails.send({
      from: 'contact@clairvisite.fr',
      to: user.email,
      subject: 'Réinitialisez votre mot de passe',
      html: `<p>Bonjour ${user.fullName},</p><p>Cliquez sur ce lien pour choisir un nouveau mot de passe (valable 1h) :</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
    });
  }
}
