import { Module } from '@nestjs/common';
import { TechniciansModule } from '../technicians/technicians.module';
import { AvailabilitiesController } from './infrastructure/http/availabilities.controller';
import { ListMyAvailabilitiesUseCase } from './application/use-cases/list-my-availabilities.use-case';
import { CreateAvailabilityUseCase } from './application/use-cases/create-availability.use-case';
import { UpdateAvailabilityUseCase } from './application/use-cases/update-availability.use-case';
import { DeleteAvailabilityUseCase } from './application/use-cases/delete-availability.use-case';
import { AVAILABILITY_REPOSITORY } from './domain/availability.repository.port';
import { PrismaAvailabilityRepository } from './infrastructure/persistence/prisma-availability.repository';

@Module({
  imports: [TechniciansModule],
  controllers: [AvailabilitiesController],
  providers: [
    ListMyAvailabilitiesUseCase,
    CreateAvailabilityUseCase,
    UpdateAvailabilityUseCase,
    DeleteAvailabilityUseCase,
    { provide: AVAILABILITY_REPOSITORY, useClass: PrismaAvailabilityRepository },
  ],
  exports: [AVAILABILITY_REPOSITORY],
})
export class AvailabilitiesModule {}
