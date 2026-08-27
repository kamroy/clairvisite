import { UpsertTechnicianProfileUseCase } from './upsert-technician-profile.use-case';
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

describe('UpsertTechnicianProfileUseCase', () => {
  it("crée ou met à jour le profil pour l'utilisateur courant", async () => {
    const data = { phone: '0600000000', specialties: ['electricite'], regions: ['idf'] };
    const created = { id: 't1', userId: 'user-1', ...data, hourlyRate: null, status: 'pending', bio: null };
    const technicians = makeTechnicians({ upsertForUser: jest.fn().mockResolvedValue(created) });
    const useCase = new UpsertTechnicianProfileUseCase(technicians);

    const result = await useCase.execute('user-1', data);

    expect(technicians.upsertForUser).toHaveBeenCalledWith('user-1', data);
    expect(result).toBe(created);
  });
});
