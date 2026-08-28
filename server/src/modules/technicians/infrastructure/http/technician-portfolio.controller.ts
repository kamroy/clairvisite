import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { RequestTechnicianPortfolioUploadUrlUseCase } from '../../application/use-cases/request-technician-portfolio-upload-url.use-case';
import { AttachTechnicianPortfolioItemUseCase } from '../../application/use-cases/attach-technician-portfolio-item.use-case';
import { RemoveTechnicianPortfolioItemUseCase } from '../../application/use-cases/remove-technician-portfolio-item.use-case';
import { ListTechnicianPortfolioItemsUseCase } from '../../application/use-cases/list-technician-portfolio-items.use-case';
import { AttachPortfolioItemDto, RequestPortfolioUploadUrlDto } from './technician-portfolio.dto';

@Controller('technicians')
export class TechnicianPortfolioController {
  constructor(
    private readonly requestUploadUrl: RequestTechnicianPortfolioUploadUrlUseCase,
    private readonly attachItem: AttachTechnicianPortfolioItemUseCase,
    private readonly removeItem: RemoveTechnicianPortfolioItemUseCase,
    private readonly listItems: ListTechnicianPortfolioItemsUseCase,
  ) {}

  // Segments littéraux 'me/...' déclarés avant ':id/portfolio' — même discipline que
  // technicians.controller.ts et technician-pricing.controller.ts.
  @Post('me/portfolio/upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('technicien')
  requestUrl(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestPortfolioUploadUrlDto) {
    return this.requestUploadUrl.execute(user.sub, dto.fileName, dto.contentType);
  }

  @Post('me/portfolio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('technicien')
  attach(@CurrentUser() user: AuthenticatedUser, @Body() dto: AttachPortfolioItemDto) {
    return this.attachItem.execute(user.sub, dto.key, dto.caption ?? null);
  }

  @Delete('me/portfolio/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('technicien')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('itemId') itemId: string) {
    return this.removeItem.execute(user.sub, itemId);
  }

  @Get(':id/portfolio')
  list(@Param('id') id: string) {
    return this.listItems.execute(id);
  }
}
