import { Inject, Injectable } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';

@Injectable()
export class ListAllBookingsForAdminUseCase {
  constructor(@Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort) {}

  execute(page: number, pageSize: number) {
    return this.bookings.findAllWithDetails(page, pageSize);
  }
}
