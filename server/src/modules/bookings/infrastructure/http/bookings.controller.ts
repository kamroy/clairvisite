import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { CreateBookingUseCase } from '../../application/use-cases/create-booking.use-case';
import { ListBuyerBookingsUseCase } from '../../application/use-cases/list-buyer-bookings.use-case';
import { ListTechnicianBookingsUseCase } from '../../application/use-cases/list-technician-bookings.use-case';
import { CancelBookingUseCase } from '../../application/use-cases/cancel-booking.use-case';
import { CreateBookingDto } from './bookings.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(
    private readonly createBooking: CreateBookingUseCase,
    private readonly listBuyerBookings: ListBuyerBookingsUseCase,
    private readonly listTechnicianBookings: ListTechnicianBookingsUseCase,
    private readonly cancelBooking: CancelBookingUseCase,
  ) {}

  @Post('bookings')
  @Roles('acheteur')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBookingDto) {
    return this.createBooking.execute({
      availabilityId: dto.availability_id,
      buyerId: user.sub,
      buyerPhone: dto.buyer_phone,
      propertyAddress: dto.property_address,
      propertyType: dto.property_type,
      surfaceM2: dto.surface_m2,
    });
  }

  @Get('bookings/me')
  @Roles('acheteur')
  mine(@CurrentUser() user: AuthenticatedUser, @Query() pagination: PaginationQueryDto) {
    return this.listBuyerBookings.execute(user.sub, pagination.page, pagination.pageSize);
  }

  @Get('technicians/me/bookings')
  @Roles('technicien')
  received(@CurrentUser() user: AuthenticatedUser, @Query() pagination: PaginationQueryDto) {
    return this.listTechnicianBookings.execute(user.sub, pagination.page, pagination.pageSize);
  }

  @Patch('bookings/:id/cancel')
  @Roles('acheteur', 'technicien')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.cancelBooking.execute(id, user.sub);
  }
}
