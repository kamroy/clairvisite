import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportsController } from './infrastructure/http/reports.controller';
import { REPORT_REPOSITORY } from './domain/report.repository.port';
import { PrismaReportRepository } from './infrastructure/persistence/prisma-report.repository';
import { GetOrCreateTechnicianReportUseCase } from './application/use-cases/get-or-create-technician-report.use-case';
import { GetReportForBuyerUseCase } from './application/use-cases/get-report-for-buyer.use-case';
import { UpdateReportConclusionUseCase } from './application/use-cases/update-report-conclusion.use-case';
import { UpdateReportSectionUseCase } from './application/use-cases/update-report-section.use-case';
import { SubmitReportUseCase } from './application/use-cases/submit-report.use-case';
import { RequestReportPhotoUploadUrlUseCase } from './application/use-cases/request-report-photo-upload-url.use-case';
import { AttachReportPhotoUseCase } from './application/use-cases/attach-report-photo.use-case';
import { RemoveReportPhotoUseCase } from './application/use-cases/remove-report-photo.use-case';

// Importe BookingsModule pour BOOKING_REPOSITORY (vérifier qui est le technicien/
// acheteur d'une réservation avant d'exposer son rapport) — même schéma que
// TechnicianExtrasModule -> TechniciansModule. FILE_STORAGE vient de StorageModule
// (@Global(), pas d'import explicite nécessaire).
@Module({
  imports: [BookingsModule, NotificationsModule],
  controllers: [ReportsController],
  providers: [
    GetOrCreateTechnicianReportUseCase,
    GetReportForBuyerUseCase,
    UpdateReportConclusionUseCase,
    UpdateReportSectionUseCase,
    SubmitReportUseCase,
    RequestReportPhotoUploadUrlUseCase,
    AttachReportPhotoUseCase,
    RemoveReportPhotoUseCase,
    { provide: REPORT_REPOSITORY, useClass: PrismaReportRepository },
  ],
})
export class ReportsModule {}
