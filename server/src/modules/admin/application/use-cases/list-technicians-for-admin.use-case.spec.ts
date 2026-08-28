import { ListTechniciansForAdminUseCase } from './list-technicians-for-admin.use-case';
import { TechnicianRepositoryPort } from '../../../technicians/domain/technician.repository.port';
import { UserRepositoryPort } from '../../../users/domain/user.repository.port';

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

function makeUsers(overrides: Partial<UserRepositoryPort> = {}): jest.Mocked<UserRepositoryPort> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByOidcSubject: jest.fn(),
    findByIds: jest.fn(),
    create: jest.fn(),
    updateProfile: jest.fn(),
    ...overrides,
  } as jest.Mocked<UserRepositoryPort>;
}

describe('ListTechniciansForAdminUseCase', () => {
  it('transmet la pagination et enrichit chaque technicien avec son utilisateur, sans N+1', async () => {
    const technicianPage = {
      items: [
        {
          id: 't1',
          userId: 'u1',
          phone: '0600000000',
          specialties: ['electricite'],
          regions: [],
          hourlyRate: null,
          status: 'pending',
          bio: null,
          category: 'technique',
        },
      ],
      page: 2,
      pageSize: 10,
      hasMore: true,
    };
    const technicians = makeTechnicians({ findAll: jest.fn().mockResolvedValue(technicianPage) });
    const users = makeUsers({
      findByIds: jest.fn().mockResolvedValue([{ id: 'u1', fullName: 'Alice', email: 'alice@test.local' }]),
    });
    const useCase = new ListTechniciansForAdminUseCase(technicians, users);

    const criteria = { page: 2, pageSize: 10 };
    const result = await useCase.execute(criteria);

    expect(technicians.findAll).toHaveBeenCalledWith(criteria);
    expect(users.findByIds).toHaveBeenCalledWith(['u1']);
    expect(result).toEqual({
      page: 2,
      pageSize: 10,
      hasMore: true,
      items: [
        {
          id: 't1',
          fullName: 'Alice',
          email: 'alice@test.local',
          specialty: 'electricite',
          category: 'technique',
          status: 'pending',
        },
      ],
    });
  });
});
