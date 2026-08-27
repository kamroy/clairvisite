import { Availability } from './availability.entity';

export const AVAILABILITY_REPOSITORY = Symbol('AVAILABILITY_REPOSITORY');

export interface CreateAvailabilityData {
  technicianId: string;
  startDatetime: Date;
  endDatetime: Date;
}

export interface AvailabilityRepositoryPort {
  findById(id: string): Promise<Availability | null>;
  findByTechnicianId(technicianId: string): Promise<Availability[]>;
  create(data: CreateAvailabilityData): Promise<Availability>;
  update(id: string, data: Partial<CreateAvailabilityData>): Promise<Availability>;
  delete(id: string): Promise<void>;
}
