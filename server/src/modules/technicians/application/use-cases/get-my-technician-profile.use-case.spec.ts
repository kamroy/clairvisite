import { GetMyTechnicianProfileUseCase } from './get-my-technician-profile.use-case';
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

describe('GetMyTechnicianProfileUseCase', () => {
  it("renvoie null si le technicien n'a pas encore créé de profil", async () => {
    const technicians = makeTechnicians({ findByUserId: jest.fn().mockResolvedValue(null) });
    const useCase = new GetMyTechnicianProfileUseCase(technicians);

    await expect(useCase.execute('user-1')).resolves.toBeNull();
  });

  it('renvoie le profil existant du technicien courant', async () => {
    const profile = { id: 't1', userId: 'user-1' };
    const technicians = makeTechnicians({ findByUserId: jest.fn().mockResolvedValue(profile) });
    const useCase = new GetMyTechnicianProfileUseCase(technicians);

    await expect(useCase.execute('user-1')).resolves.toBe(profile);
    expect(technicians.findByUserId).toHaveBeenCalledWith('user-1');
  });
});
