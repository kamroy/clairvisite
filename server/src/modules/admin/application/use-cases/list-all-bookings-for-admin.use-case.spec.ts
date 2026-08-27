import { ListAllBookingsForAdminUseCase } from './list-all-bookings-for-admin.use-case';
import { BookingRepositoryPort } from '../../../bookings/domain/booking.repository.port';

function makeRepo(overrides: Partial<BookingRepositoryPort> = {}): jest.Mocked<BookingRepositoryPort> {
  return {
    findById: jest.fn(),
    findByIdWithDetails: jest.fn(),
    findByBuyerId: jest.fn(),
    findByTechnicianUserId: jest.fn(),
    findAllWithDetails: jest.fn(),
    setStatus: jest.fn(),
    createIfSlotAvailable: jest.fn(),
    ...overrides,
  } as jest.Mocked<BookingRepositoryPort>;
}

describe('ListAllBookingsForAdminUseCase', () => {
  it('transmet la pagination au repository', async () => {
    const page = { items: [], page: 3, pageSize: 20, hasMore: false };
    const bookings = makeRepo({ findAllWithDetails: jest.fn().mockResolvedValue(page) });
    const useCase = new ListAllBookingsForAdminUseCase(bookings);

    const result = await useCase.execute(3, 20);

    expect(bookings.findAllWithDetails).toHaveBeenCalledWith(3, 20);
    expect(result).toBe(page);
  });
});
