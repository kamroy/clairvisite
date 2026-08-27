import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { ListMyAvailabilitiesUseCase } from '../../application/use-cases/list-my-availabilities.use-case';
import { CreateAvailabilityUseCase } from '../../application/use-cases/create-availability.use-case';
import { UpdateAvailabilityUseCase } from '../../application/use-cases/update-availability.use-case';
import { DeleteAvailabilityUseCase } from '../../application/use-cases/delete-availability.use-case';
import { CreateAvailabilityDto, UpdateAvailabilityDto } from './availabilities.dto';

@Controller('technicians/me/availabilities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('technicien')
export class AvailabilitiesController {
  constructor(
    private readonly listMine: ListMyAvailabilitiesUseCase,
    private readonly createSlot: CreateAvailabilityUseCase,
    private readonly updateSlot: UpdateAvailabilityUseCase,
    private readonly deleteSlot: DeleteAvailabilityUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.listMine.execute(user.sub);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAvailabilityDto) {
    return this.createSlot.execute(user.sub, {
      startDatetime: new Date(dto.startDatetime),
      endDatetime: new Date(dto.endDatetime),
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAvailabilityDto) {
    return this.updateSlot.execute(user.sub, id, {
      startDatetime: dto.startDatetime ? new Date(dto.startDatetime) : undefined,
      endDatetime: dto.endDatetime ? new Date(dto.endDatetime) : undefined,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deleteSlot.execute(user.sub, id);
  }
}
