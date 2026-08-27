import { NotFoundException } from '@nestjs/common';
import { CreateAvailabilityUseCase } from './create-availability.use-case';
import { TechnicianRepositoryPort } from '../../../technicians/domain/technician.repository.port';
import { AvailabilityRepositoryPort } from '../../domain/availability.repository.port';

function makeTechnicians(overrides: Partial<TechnicianRepositoryPort> = {}): jest.Mocked<TechnicianRepositoryPort> {
  return {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findDetailById: jest.fn(),
    search: jest.fn(),
    upsertForUser: jest.fn(),
    setStatus: jest.fn(),
    findAll: jest.fn(),
    ...overrides,
  } as jest.Mocked<TechnicianRepositoryPort>;
}

function makeAvailabilities(overrides: Partial<AvailabilityRepositoryPort> = {}): jest.Mocked<AvailabilityRepositoryPort> {
  return {
    findById: jest.fn(),
    findByTechnicianId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  } as jest.Mocked<AvailabilityRepositoryPort>;
}

const input = { startDatetime: new Date('2026-09-01T10:00:00Z'), endDatetime: new Date('2026-09-01T11:00:00Z') };

describe('CreateAvailabilityUseCase', () => {
  it("404 si l'utilisateur n'a pas de profil technicien", async () => {
    const technicians = makeTechnicians({ findByUserId: jest.fn().mockResolvedValue(null) });
    const useCase = new CreateAvailabilityUseCase(technicians, makeAvailabilities());

    await expect(useCase.execute('user-1', input)).rejects.toBeInstanceOf(NotFoundException);
  });

  // Choix assumé : un technicien "pending" peut préparer son agenda pendant qu'il
  // attend la validation admin — c'est la réservation (createIfSlotAvailable), pas la
  // création de créneau, qui doit bloquer tant qu'il n'est pas "approved".
  it('autorise un technicien "pending" à créer un créneau', async () => {
    const technicians = makeTechnicians({ findByUserId: jest.fn().mockResolvedValue({ id: 'tech-1', status: 'pending' }) });
    const created = { id: 'slot-1', technicianId: 'tech-1', ...input, isBooked: false };
    const availabilities = makeAvailabilities({ create: jest.fn().mockResolvedValue(created) });
    const useCase = new CreateAvailabilityUseCase(technicians, availabilities);

    const result = await useCase.execute('user-1', input);

    expect(availabilities.create).toHaveBeenCalledWith({ technicianId: 'tech-1', ...input });
    expect(result).toBe(created);
  });
});
