import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { RequestTechnicianDocumentUploadUrlUseCase } from '../../application/use-cases/request-technician-document-upload-url.use-case';
import { AttachTechnicianDocumentUseCase } from '../../application/use-cases/attach-technician-document.use-case';
import { ListMyTechnicianDocumentsUseCase } from '../../application/use-cases/list-my-technician-documents.use-case';
import { AttachDocumentDto, RequestDocumentUploadUrlDto } from './technician-documents.dto';

@Controller('technicians/me/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('technicien')
export class TechnicianDocumentsController {
  constructor(
    private readonly requestUploadUrl: RequestTechnicianDocumentUploadUrlUseCase,
    private readonly attachDocument: AttachTechnicianDocumentUseCase,
    private readonly listDocuments: ListMyTechnicianDocumentsUseCase,
  ) {}

  @Post('upload-url')
  requestUrl(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestDocumentUploadUrlDto) {
    return this.requestUploadUrl.execute(user.sub, dto.fileName, dto.contentType);
  }

  @Post()
  attach(@CurrentUser() user: AuthenticatedUser, @Body() dto: AttachDocumentDto) {
    return this.attachDocument.execute(user.sub, dto.key, dto.fileName);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.listDocuments.execute(user.sub);
  }
}
