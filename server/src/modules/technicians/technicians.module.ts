import { Module } from '@nestjs/common';
import { TechniciansController } from './infrastructure/http/technicians.controller';
import { UpsertTechnicianProfileUseCase } from './application/use-cases/upsert-technician-profile.use-case';
import { SearchTechniciansUseCase } from './application/use-cases/search-technicians.use-case';
import { GetTechnicianUseCase } from './application/use-cases/get-technician.use-case';
import { GetMyTechnicianProfileUseCase } from './application/use-cases/get-my-technician-profile.use-case';
import { TECHNICIAN_REPOSITORY } from './domain/technician.repository.port';
import { PrismaTechnicianRepository } from './infrastructure/persistence/prisma-technician.repository';

@Module({
  controllers: [TechniciansController],
  providers: [
    UpsertTechnicianProfileUseCase,
    SearchTechniciansUseCase,
    GetTechnicianUseCase,
    GetMyTechnicianProfileUseCase,
    { provide: TECHNICIAN_REPOSITORY, useClass: PrismaTechnicianRepository },
  ],
  exports: [TECHNICIAN_REPOSITORY],
})
export class TechniciansModule {}
