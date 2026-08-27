import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  BOOKING_REPOSITORY,
  BookingRepositoryPort,
  SlotAlreadyBookedError,
  TechnicianNotAvailableError,
} from '../../domain/booking.repository.port';
import { BOOKING_EMAIL_NOTIFIER, BookingEmailNotifierPort } from '../ports/booking-email-notifier.port';

export interface CreateBookingInput {
  availabilityId: string;
  buyerId: string;
  buyerPhone: string;
  propertyAddress: string;
}

@Injectable()
export class CreateBookingUseCase {
  private readonly logger = new Logger(CreateBookingUseCase.name);

  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(BOOKING_EMAIL_NOTIFIER) private readonly notifier: BookingEmailNotifierPort,
  ) {}

  async execute(input: CreateBookingInput) {
    let booking;
    try {
      // Toute la logique de verrouillage (transaction DB) vit dans l'adapter
      // Prisma ; le use case ne connaît que le contrat "créer si libre".
      booking = await this.bookings.createIfSlotAvailable({
        availabilityId: input.availabilityId,
        buyerId: input.buyerId,
        buyerPhone: input.buyerPhone,
        propertyAddress: input.propertyAddress,
      });
    } catch (err) {
      if (err instanceof SlotAlreadyBookedError || err instanceof TechnicianNotAvailableError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }

    // Envoi asynchrone, ne bloque pas la réponse à l'acheteur (spec §7)
    this.notifier
      .sendConfirmation(booking)
      .catch((err) => this.logger.error('Échec envoi email de confirmation', err));

    return booking;
  }
}
