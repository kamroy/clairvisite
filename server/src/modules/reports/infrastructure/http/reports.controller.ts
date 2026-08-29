import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { GetOrCreateTechnicianReportUseCase } from '../../application/use-cases/get-or-create-technician-report.use-case';
import { GetReportForBuyerUseCase } from '../../application/use-cases/get-report-for-buyer.use-case';
import { UpdateReportConclusionUseCase } from '../../application/use-cases/update-report-conclusion.use-case';
import { UpdateReportSectionUseCase } from '../../application/use-cases/update-report-section.use-case';
import { SubmitReportUseCase } from '../../application/use-cases/submit-report.use-case';
import { RequestReportPhotoUploadUrlUseCase } from '../../application/use-cases/request-report-photo-upload-url.use-case';
import { AttachReportPhotoUseCase } from '../../application/use-cases/attach-report-photo.use-case';
import { RemoveReportPhotoUseCase } from '../../application/use-cases/remove-report-photo.use-case';
import {
  AttachReportPhotoDto,
  RequestReportPhotoUploadUrlDto,
  UpdateReportConclusionDto,
  UpdateReportSectionDto,
} from './reports.dto';

@Controller('bookings/:bookingId/report')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly getForTechnician: GetOrCreateTechnicianReportUseCase,
    private readonly getForBuyer: GetReportForBuyerUseCase,
    private readonly updateConclusion: UpdateReportConclusionUseCase,
    private readonly updateSection: UpdateReportSectionUseCase,
    private readonly submitReport: SubmitReportUseCase,
    private readonly requestPhotoUploadUrl: RequestReportPhotoUploadUrlUseCase,
    private readonly attachPhoto: AttachReportPhotoUseCase,
    private readonly removePhoto: RemoveReportPhotoUseCase,
  ) {}

  // Une seule route GET pour les deux rôles : l'acheteur ne voit jamais un brouillon
  // (traité comme "pas de rapport" par GetReportForBuyerUseCase), l'expert voit et
  // fait naître son brouillon au premier accès.
  @Get()
  @Roles('acheteur', 'technicien')
  get(@Param('bookingId') bookingId: string, @CurrentUser() user: AuthenticatedUser) {
    return user.role === 'technicien'
      ? this.getForTechnician.execute(user.sub, bookingId)
      : this.getForBuyer.execute(user.sub, bookingId);
  }

  @Patch()
  @Roles('technicien')
  updateConclusionRoute(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateReportConclusionDto,
  ) {
    return this.updateConclusion.execute(user.sub, bookingId, dto.general_conclusion);
  }

  @Patch('sections/:sectionType')
  @Roles('technicien')
  updateSectionRoute(
    @Param('bookingId') bookingId: string,
    @Param('sectionType') sectionType: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateReportSectionDto,
  ) {
    return this.updateSection.execute(user.sub, bookingId, sectionType, { content: dto.content, status: dto.status });
  }

  @Post('submit')
  @Roles('technicien')
  submit(@Param('bookingId') bookingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.submitReport.execute(user.sub, bookingId);
  }

  @Post('sections/:sectionType/photos/upload-url')
  @Roles('technicien')
  requestUploadUrl(
    @Param('bookingId') bookingId: string,
    @Param('sectionType') sectionType: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestReportPhotoUploadUrlDto,
  ) {
    return this.requestPhotoUploadUrl.execute(user.sub, bookingId, sectionType, dto.file_name, dto.content_type);
  }

  @Post('sections/:sectionType/photos')
  @Roles('technicien')
  attach(
    @Param('bookingId') bookingId: string,
    @Param('sectionType') sectionType: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AttachReportPhotoDto,
  ) {
    return this.attachPhoto.execute(user.sub, bookingId, sectionType, dto.key, dto.caption ?? null, dto.role ?? null);
  }

  @Delete('photos/:photoId')
  @Roles('technicien')
  remove(
    @Param('bookingId') bookingId: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.removePhoto.execute(user.sub, bookingId, photoId);
  }
}
