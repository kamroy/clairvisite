import { Inject, Injectable } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../domain/booking.repository.port';

@Injectable()
export class ListTechnicianBookingsUseCase {
  constructor(@Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort) {}

  execute(technicianUserId: string, page: number, pageSize: number) {
    return this.bookings.findByTechnicianUserId(technicianUserId, page, pageSize);
  }
}
