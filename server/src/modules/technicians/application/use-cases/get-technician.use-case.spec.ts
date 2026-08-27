import { NotFoundException } from '@nestjs/common';
import { GetTechnicianUseCase } from './get-technician.use-case';
import { TechnicianRepositoryPort } from '../../domain/technician.repository.port';

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

describe('GetTechnicianUseCase', () => {
  it("404 si le technicien n'existe pas", async () => {
    const technicians = makeTechnicians({ findDetailById: jest.fn().mockResolvedValue(null) });
    const useCase = new GetTechnicianUseCase(technicians);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  // Régression : la modération admin doit bloquer la visibilité publique d'un
  // technicien pending/rejected, pas seulement le filtrage de search().
  it.each(['pending', 'rejected'] as const)('404 si le technicien est %s (non approuvé)', async (status) => {
    const technicians = makeTechnicians({
      findDetailById: jest.fn().mockResolvedValue({ id: 't1', status }),
    });
    const useCase = new GetTechnicianUseCase(technicians);

    await expect(useCase.execute('t1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('renvoie la fiche détaillée pour un technicien approuvé', async () => {
    const detail = { id: 't1', status: 'approved', fullName: 'Alice', availableSlots: [] };
    const technicians = makeTechnicians({ findDetailById: jest.fn().mockResolvedValue(detail) });
    const useCase = new GetTechnicianUseCase(technicians);

    await expect(useCase.execute('t1')).resolves.toBe(detail);
  });
});
