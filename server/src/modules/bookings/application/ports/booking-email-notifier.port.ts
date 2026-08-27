import { BookingWithDetails } from '../../domain/booking.repository.port';

export const BOOKING_EMAIL_NOTIFIER = Symbol('BOOKING_EMAIL_NOTIFIER');

export interface BookingEmailNotifierPort {
  sendConfirmation(booking: BookingWithDetails): Promise<void>;
  sendCancellation(booking: BookingWithDetails): Promise<void>;
}
