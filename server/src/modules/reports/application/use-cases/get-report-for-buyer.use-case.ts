import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';
import { REPORT_REPOSITORY, ReportRepositoryPort } from '../../domain/report.repository.port';
import { FILE_STORAGE, FileStoragePort } from '../../../../infrastructure/storage/file-storage.port';
import { withPhotoDownloadUrls } from './report-view.mapper';

@Injectable()
export class GetReportForBuyerUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookings: BookingRepositoryPort,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepositoryPort,
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
  ) {}

  async execute(buyerId: string, bookingId: string) {
    const booking = await this.bookings.findByIdWithDetails(bookingId);
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.buyerId !== buyerId) throw new ForbiddenException("Cette réservation ne vous appartient pas.");

    const report = await this.reports.findByBookingId(bookingId);
    // Un brouillon n'est pas encore prêt pour l'acheteur : traité comme "pas de
    // rapport" plutôt que d'exposer qu'une rédaction est en cours mais incomplète.
    if (!report || report.status !== 'submitted') {
      throw new NotFoundException("Aucun rapport disponible pour cette réservation pour l'instant.");
    }

    return withPhotoDownloadUrls(report, this.storage);
  }
}
