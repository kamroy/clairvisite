import { createHash } from 'crypto';
import { InvalidOrExpiredVerificationTokenError, VerifyEmailUseCase } from './verify-email.use-case';
import { UserRepositoryPort } from '../../users/domain/user.repository.port';
import { SessionTokenIssuerPort } from './session-token-issuer.port';

function makeUsers(overrides: Partial<UserRepositoryPort> = {}): jest.Mocked<UserRepositoryPort> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByOidcSubject: jest.fn(),
    create: jest.fn(),
    updateProfile: jest.fn(),
    setEmailVerificationToken: jest.fn(),
    findByEmailVerificationTokenHash: jest.fn(),
    markEmailVerified: jest.fn(),
    ...overrides,
  } as jest.Mocked<UserRepositoryPort>;
}

const tokens: jest.Mocked<SessionTokenIssuerPort> = { issue: jest.fn().mockReturnValue('session-token') };

const rawToken = 'raw-token-value';
const tokenHash = createHash('sha256').update(rawToken).digest('hex');

describe('VerifyEmailUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejette un jeton qui ne correspond à aucun utilisateur', async () => {
    const users = makeUsers({ findByEmailVerificationTokenHash: jest.fn().mockResolvedValue(null) });
    const useCase = new VerifyEmailUseCase(users, tokens);

    await expect(useCase.execute(rawToken)).rejects.toBeInstanceOf(InvalidOrExpiredVerificationTokenError);
    expect(users.findByEmailVerificationTokenHash).toHaveBeenCalledWith(tokenHash);
    expect(users.markEmailVerified).not.toHaveBeenCalled();
  });

  it('rejette un jeton expiré', async () => {
    const expired = { id: 'u1', emailVerificationTokenExpiresAt: new Date(Date.now() - 1000) } as any;
    const users = makeUsers({ findByEmailVerificationTokenHash: jest.fn().mockResolvedValue(expired) });
    const useCase = new VerifyEmailUseCase(users, tokens);

    await expect(useCase.execute(rawToken)).rejects.toBeInstanceOf(InvalidOrExpiredVerificationTokenError);
    expect(users.markEmailVerified).not.toHaveBeenCalled();
  });

  it('marque le compte vérifié et délivre une session pour un jeton valide', async () => {
    const found = { id: 'u1', emailVerificationTokenExpiresAt: new Date(Date.now() + 60_000) } as any;
    const verified = { id: 'u1', role: 'acheteur', email: 'user@example.com' } as any;
    const users = makeUsers({
      findByEmailVerificationTokenHash: jest.fn().mockResolvedValue(found),
      markEmailVerified: jest.fn().mockResolvedValue(verified),
    });
    const useCase = new VerifyEmailUseCase(users, tokens);

    const sessionToken = await useCase.execute(rawToken);

    expect(users.markEmailVerified).toHaveBeenCalledWith('u1');
    expect(tokens.issue).toHaveBeenCalledWith({ sub: 'u1', role: 'acheteur', email: 'user@example.com' });
    expect(sessionToken).toBe('session-token');
  });
});
