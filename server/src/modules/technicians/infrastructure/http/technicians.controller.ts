import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { UpsertTechnicianProfileUseCase } from '../../application/use-cases/upsert-technician-profile.use-case';
import { SearchTechniciansUseCase } from '../../application/use-cases/search-technicians.use-case';
import { GetTechnicianUseCase } from '../../application/use-cases/get-technician.use-case';
import { GetMyTechnicianProfileUseCase } from '../../application/use-cases/get-my-technician-profile.use-case';
import { TechnicianDetail } from '../../domain/technician.repository.port';
import { UpsertTechnicianProfileDto } from './technicians.dto';

// Vue publique (non authentifiée) d'un technicien : le téléphone n'est communiqué
// qu'après réservation (via les détails de la réservation), jamais sur le profil public.
function toPublicTechnician({ phone, ...publicFields }: TechnicianDetail) {
  return publicFields;
}

@Controller('technicians')
export class TechniciansController {
  constructor(
    private readonly upsertProfile: UpsertTechnicianProfileUseCase,
    private readonly searchTechnicians: SearchTechniciansUseCase,
    private readonly getTechnician: GetTechnicianUseCase,
    private readonly getMyProfile: GetMyTechnicianProfileUseCase,
  ) {}

  @Post('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('technicien')
  createProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertTechnicianProfileDto) {
    return this.upsertProfile.execute(user.sub, dto);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('technicien')
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertTechnicianProfileDto) {
    return this.upsertProfile.execute(user.sub, dto);
  }

  // Doit être déclaré avant `getById` (':id') : sinon Nest/Express matcherait
  // GET /technicians/profile comme id="profile".
  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('technicien')
  getMyTechnicianProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.getMyProfile.execute(user.sub);
  }

  @Get()
  async search(
    @Query('region') region?: string,
    @Query('specialty') specialty?: string,
    @Query('date') date?: string,
    @Query() pagination?: PaginationQueryDto,
  ) {
    return this.searchTechnicians.execute({
      region,
      specialty,
      availableFrom: date ? new Date(date) : undefined,
      page: pagination?.page ?? 1,
      pageSize: pagination?.pageSize ?? 12,
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const technician = await this.getTechnician.execute(id);
    return toPublicTechnician(technician);
  }
}
