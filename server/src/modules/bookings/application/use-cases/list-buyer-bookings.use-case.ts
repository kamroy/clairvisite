import { Inject, Injectable } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../domain/booking.repository.port';

@Injectable()
export class ListBuyerBookingsUseCase {
  constructor(@Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort) {}

  execute(buyerId: string, page: number, pageSize: number) {
    return this.bookings.findByBuyerId(buyerId, page, pageSize);
  }
}
