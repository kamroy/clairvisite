import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { BookingWithDetails } from '../../domain/booking.repository.port';
import { BookingEmailNotifierPort } from '../../application/ports/booking-email-notifier.port';

@Injectable()
export class ResendBookingEmailNotifier implements BookingEmailNotifierPort {
  private readonly resend: Resend;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'));
  }

  async sendConfirmation(booking: BookingWithDetails): Promise<void> {
    const slotLabel = booking.slotStart.toLocaleString('fr-FR');

    await Promise.all([
      this.resend.emails.send({
        from: 'reservations@clairvisite.fr',
        to: booking.buyerEmail,
        subject: 'Votre clairvisite est confirmée',
        html: `<p>Votre créneau du ${slotLabel} avec ${booking.technicianFullName} est confirmé.</p>`,
      }),
      this.resend.emails.send({
        from: 'reservations@clairvisite.fr',
        to: booking.technicianEmail,
        subject: 'Nouvelle réservation',
        html: `<p>Vous avez une nouvelle réservation le ${slotLabel}.</p>`,
      }),
    ]);
  }

  async sendCancellation(booking: BookingWithDetails): Promise<void> {
    const slotLabel = booking.slotStart.toLocaleString('fr-FR');

    await Promise.all([
      this.resend.emails.send({
        from: 'reservations@clairvisite.fr',
        to: booking.buyerEmail,
        subject: 'Réservation annulée',
        html: `<p>Votre créneau du ${slotLabel} a été annulé.</p>`,
      }),
      this.resend.emails.send({
        from: 'reservations@clairvisite.fr',
        to: booking.technicianEmail,
        subject: 'Réservation annulée',
        html: `<p>La réservation du ${slotLabel} a été annulée.</p>`,
      }),
    ]);
  }
}
