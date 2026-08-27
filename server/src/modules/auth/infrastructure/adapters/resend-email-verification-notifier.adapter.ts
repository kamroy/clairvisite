import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailVerificationNotifierPort } from '../../application/ports/email-verification-notifier.port';

@Injectable()
export class ResendEmailVerificationNotifier implements EmailVerificationNotifierPort {
  private readonly resend: Resend;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'));
  }

  async sendVerificationEmail(user: { email: string; fullName: string }, verificationUrl: string): Promise<void> {
    await this.resend.emails.send({
      from: 'contact@clairvisite.fr',
      to: user.email,
      subject: 'Confirmez votre adresse email',
      html: `<p>Bonjour ${user.fullName},</p><p>Cliquez sur ce lien pour valider votre compte (valable 24h) :</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
    });
  }
}
