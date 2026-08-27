import { Module } from '@nestjs/common';
import { TechniciansModule } from '../technicians/technicians.module';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './infrastructure/http/admin.controller';
import { ListTechniciansForAdminUseCase } from './application/use-cases/list-technicians-for-admin.use-case';
import { SetTechnicianStatusUseCase } from './application/use-cases/set-technician-status.use-case';
import { ListAllBookingsForAdminUseCase } from './application/use-cases/list-all-bookings-for-admin.use-case';

@Module({
  imports: [TechniciansModule, BookingsModule, UsersModule],
  controllers: [AdminController],
  providers: [ListTechniciansForAdminUseCase, SetTechnicianStatusUseCase, ListAllBookingsForAdminUseCase],
})
export class AdminModule {}
