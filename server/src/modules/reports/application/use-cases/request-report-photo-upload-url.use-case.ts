import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';
import { REPORT_SECTION_TYPES, ReportSectionType } from '../../domain/report.entity';
import { FILE_STORAGE, FileStoragePort } from '../../../../infrastructure/storage/file-storage.port';

@Injectable()
export class RequestReportPhotoUploadUrlUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
  ) {}

  async execute(technicianUserId: string, bookingId: string, sectionType: string, fileName: string, contentType: string) {
    if (!REPORT_SECTION_TYPES.includes(sectionType as ReportSectionType)) {
      throw new BadRequestException('Section de rapport inconnue.');
    }

    const booking = await this.bookings.findByIdWithDetails(bookingId);
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.technicianUserId !== technicianUserId) {
      throw new ForbiddenException("Vous n'êtes pas l'expert assigné à cette réservation.");
    }

    const key = `reports/${bookingId}/${sectionType}/${randomUUID()}-${fileName}`;
    const uploadUrl = await this.storage.getUploadUrl(key, contentType);
    return { uploadUrl, key };
  }
}
