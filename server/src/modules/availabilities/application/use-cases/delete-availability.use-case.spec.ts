import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteAvailabilityUseCase } from './delete-availability.use-case';
import { AvailabilityRepositoryPort } from '../../domain/availability.repository.port';
import { TechnicianRepositoryPort } from '../../../technicians/domain/technician.repository.port';

function makeAvailabilities(overrides: Partial<AvailabilityRepositoryPort> = {}): jest.Mocked<AvailabilityRepositoryPort> {
  return {
    findById: jest.fn(),
    findByTechnicianId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
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

describe('DeleteAvailabilityUseCase', () => {
  it('404 si le créneau n’existe pas', async () => {
    const availabilities = makeAvailabilities({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new DeleteAvailabilityUseCase(availabilities, makeTechnicians());

    await expect(useCase.execute('user-A', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  // Régression IDOR (même correctif que UpdateAvailabilityUseCase) : sans ce contrôle,
  // un technicien pouvait supprimer le créneau d'un concurrent.
  it("403 si le créneau n'appartient pas au technicien courant", async () => {
    const availabilities = makeAvailabilities({ findById: jest.fn().mockResolvedValue(slot) });
    const technicians = makeTechnicians({ findByUserId: jest.fn().mockResolvedValue({ id: 'tech-B' } as any) });
    const useCase = new DeleteAvailabilityUseCase(availabilities, technicians);

    await expect(useCase.execute('user-B', 'slot-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(availabilities.delete).not.toHaveBeenCalled();
  });

  it('409 si le créneau est déjà réservé', async () => {
    const bookedSlot = { ...slot, isBooked: true };
    const availabilities = makeAvailabilities({ findById: jest.fn().mockResolvedValue(bookedSlot) });
    const technicians = makeTechnicians({ findByUserId: jest.fn().mockResolvedValue({ id: 'tech-A' } as any) });
    const useCase = new DeleteAvailabilityUseCase(availabilities, technicians);

    await expect(useCase.execute('user-A', 'slot-1')).rejects.toBeInstanceOf(ConflictException);
    expect(availabilities.delete).not.toHaveBeenCalled();
  });

  it('supprime le créneau pour son propriétaire', async () => {
    const availabilities = makeAvailabilities({ findById: jest.fn().mockResolvedValue(slot) });
    const technicians = makeTechnicians({ findByUserId: jest.fn().mockResolvedValue({ id: 'tech-A' } as any) });
    const useCase = new DeleteAvailabilityUseCase(availabilities, technicians);

    await useCase.execute('user-A', 'slot-1');

    expect(availabilities.delete).toHaveBeenCalledWith('slot-1');
  });
});
