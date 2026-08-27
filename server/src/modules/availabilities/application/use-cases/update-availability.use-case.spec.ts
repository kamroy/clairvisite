import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateAvailabilityUseCase } from './update-availability.use-case';
import { AvailabilityRepositoryPort } from '../../domain/availability.repository.port';
import { TechnicianRepositoryPort } from '../../../technicians/domain/technician.repository.port';

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

function makeTechnicians(overrides: Partial<TechnicianRepositoryPort> = {}): jest.Mocked<TechnicianRepositoryPort> {
  return {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    search: jest.fn(),
    upsertForUser: jest.fn(),
    setStatus: jest.fn(),
    findAll: jest.fn(),
    ...overrides,
  } as jest.Mocked<TechnicianRepositoryPort>;
}

const slot = { id: 'slot-1', technicianId: 'tech-A', isBooked: false } as any;

describe('UpdateAvailabilityUseCase', () => {
  it('404 si le créneau n’existe pas', async () => {
    const availabilities = makeAvailabilities({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new UpdateAvailabilityUseCase(availabilities, makeTechnicians());

    await expect(useCase.execute('user-A', 'missing', {})).rejects.toBeInstanceOf(NotFoundException);
  });

  // Régression IDOR : avant le correctif, n'importe quel technicien authentifié pouvait
  // modifier le créneau d'un autre technicien simplement en connaissant son id (visible
  // publiquement sur la fiche technicien).
  it("403 si le créneau n'appartient pas au technicien courant", async () => {
    const availabilities = makeAvailabilities({ findById: jest.fn().mockResolvedValue(slot) });
    const technicians = makeTechnicians({ findByUserId: jest.fn().mockResolvedValue({ id: 'tech-B' } as any) });
    const useCase = new UpdateAvailabilityUseCase(availabilities, technicians);

    await expect(useCase.execute('user-B', 'slot-1', {})).rejects.toBeInstanceOf(ForbiddenException);
    expect(availabilities.update).not.toHaveBeenCalled();
  });

  it("403 si l'appelant n'a pas de profil technicien du tout", async () => {
    const availabilities = makeAvailabilities({ findById: jest.fn().mockResolvedValue(slot) });
    const technicians = makeTechnicians({ findByUserId: jest.fn().mockResolvedValue(null) });
    const useCase = new UpdateAvailabilityUseCase(availabilities, technicians);

    await expect(useCase.execute('user-without-profile', 'slot-1', {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('409 si le créneau est déjà réservé, même pour son propriétaire', async () => {
    const bookedSlot = { ...slot, isBooked: true };
    const availabilities = makeAvailabilities({ findById: jest.fn().mockResolvedValue(bookedSlot) });
    const technicians = makeTechnicians({ findByUserId: jest.fn().mockResolvedValue({ id: 'tech-A' } as any) });
    const useCase = new UpdateAvailabilityUseCase(availabilities, technicians);

    await expect(useCase.execute('user-A', 'slot-1', {})).rejects.toBeInstanceOf(ConflictException);
  });

  it('met à jour le créneau pour son propriétaire', async () => {
    const updated = { ...slot, startDatetime: new Date() };
    const availabilities = makeAvailabilities({
      findById: jest.fn().mockResolvedValue(slot),
      update: jest.fn().mockResolvedValue(updated),
    });
    const technicians = makeTechnicians({ findByUserId: jest.fn().mockResolvedValue({ id: 'tech-A' } as any) });
    const useCase = new UpdateAvailabilityUseCase(availabilities, technicians);

    const data = { startDatetime: new Date() };
    const result = await useCase.execute('user-A', 'slot-1', data);

    expect(availabilities.update).toHaveBeenCalledWith('slot-1', data);
    expect(result).toBe(updated);
  });
});
