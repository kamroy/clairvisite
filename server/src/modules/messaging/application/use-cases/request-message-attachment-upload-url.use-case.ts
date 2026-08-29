import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';
import { FILE_STORAGE, FileStoragePort } from '../../../../infrastructure/storage/file-storage.port';

@Injectable()
export class RequestMessageAttachmentUploadUrlUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
  ) {}

  async execute(userId: string, bookingId: string, fileName: string, contentType: string) {
    const booking = await this.bookings.findByIdWithDetails(bookingId);
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.buyerId !== userId && booking.technicianUserId !== userId) {
      throw new ForbiddenException("Cette conversation ne vous appartient pas.");
    }

    const key = `messages/${bookingId}/${randomUUID()}-${fileName}`;
    const uploadUrl = await this.storage.getUploadUrl(key, contentType);
    return { uploadUrl, key };
  }
}
