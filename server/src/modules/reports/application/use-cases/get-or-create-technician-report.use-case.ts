import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';
import { REPORT_REPOSITORY, ReportRepositoryPort } from '../../domain/report.repository.port';
import { FILE_STORAGE, FileStoragePort } from '../../../../infrastructure/storage/file-storage.port';
import { withPhotoDownloadUrls } from './report-view.mapper';

// Auto-crée le brouillon au premier accès plutôt que d'exiger une action "démarrer le
// rapport" séparée — un technicien qui ouvre l'éditeur pour la première fois voit
// directement ses 5 sections vides prêtes à remplir.
@Injectable()
export class GetOrCreateTechnicianReportUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepositoryPort,
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
  ) {}

  async execute(technicianUserId: string, bookingId: string) {
    const booking = await this.bookings.findByIdWithDetails(bookingId);
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.technicianUserId !== technicianUserId) {
      throw new ForbiddenException("Vous n'êtes pas l'expert assigné à cette réservation.");
    }

    const report = (await this.reports.findByBookingId(bookingId)) ?? (await this.reports.createDraft(bookingId));
    return withPhotoDownloadUrls(report, this.storage);
  }
}
