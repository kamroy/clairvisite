import { Module } from '@nestjs/common';
import { BookingsController } from './infrastructure/http/bookings.controller';
import { CreateBookingUseCase } from './application/use-cases/create-booking.use-case';
import { ListBuyerBookingsUseCase } from './application/use-cases/list-buyer-bookings.use-case';
import { ListTechnicianBookingsUseCase } from './application/use-cases/list-technician-bookings.use-case';
import { CancelBookingUseCase } from './application/use-cases/cancel-booking.use-case';
import { BOOKING_REPOSITORY } from './domain/booking.repository.port';
import { PrismaBookingRepository } from './infrastructure/persistence/prisma-booking.repository';
import { BOOKING_EMAIL_NOTIFIER } from './application/ports/booking-email-notifier.port';
import { ResendBookingEmailNotifier } from './infrastructure/adapters/resend-booking-email-notifier.adapter';

@Module({
  controllers: [BookingsController],
  providers: [
    CreateBookingUseCase,
    ListBuyerBookingsUseCase,
    ListTechnicianBookingsUseCase,
    CancelBookingUseCase,
    { provide: BOOKING_REPOSITORY, useClass: PrismaBookingRepository },
    { provide: BOOKING_EMAIL_NOTIFIER, useClass: ResendBookingEmailNotifier },
  ],
  exports: [BOOKING_REPOSITORY],
})
export class BookingsModule {}
