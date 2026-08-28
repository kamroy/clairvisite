import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { ListTechniciansForAdminUseCase } from '../../application/use-cases/list-technicians-for-admin.use-case';
import { SetTechnicianStatusUseCase } from '../../application/use-cases/set-technician-status.use-case';
import { ListAllBookingsForAdminUseCase } from '../../application/use-cases/list-all-bookings-for-admin.use-case';
import { TechnicianCategory, TechnicianStatus } from '../../../technicians/domain/technician.entity';
import { SetTechnicianStatusDto } from './admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly listTechnicians: ListTechniciansForAdminUseCase,
    private readonly setTechnicianStatus: SetTechnicianStatusUseCase,
    private readonly listAllBookings: ListAllBookingsForAdminUseCase,
  ) {}

  @Get('technicians')
  technicians(
    @Query('status') status: TechnicianStatus,
    @Query('category') category: TechnicianCategory,
    @Query('search') search: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.listTechnicians.execute({
      status,
      category,
      search,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
  }

  @Patch('technicians/:id/status')
  setStatus(@Param('id') id: string, @Body() dto: SetTechnicianStatusDto) {
    return this.setTechnicianStatus.execute(id, dto.status);
  }

  @Get('bookings')
  bookings(@Query() pagination: PaginationQueryDto) {
    return this.listAllBookings.execute(pagination.page, pagination.pageSize);
  }
}
