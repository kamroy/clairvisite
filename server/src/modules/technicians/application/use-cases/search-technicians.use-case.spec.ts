import { SearchTechniciansUseCase } from './search-technicians.use-case';
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

describe('SearchTechniciansUseCase', () => {
  it('transmet les critères de recherche au repository et renvoie sa page de résultats', async () => {
    const page = {
      items: [{ id: 't1', fullName: 'Alice', specialties: [], regions: [], hourlyRate: null, availableSlotsCount: 2 }],
      page: 1,
      pageSize: 12,
      hasMore: false,
    };
    const technicians = makeTechnicians({ search: jest.fn().mockResolvedValue(page) });
    const useCase = new SearchTechniciansUseCase(technicians);

    const criteria = { region: 'idf', specialty: 'electricite', availableFrom: new Date(), page: 1, pageSize: 12 };
    const result = await useCase.execute(criteria);

    expect(technicians.search).toHaveBeenCalledWith(criteria);
    expect(result).toBe(page);
  });
});
