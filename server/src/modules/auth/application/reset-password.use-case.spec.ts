import { createHash } from 'crypto';
import { InvalidOrExpiredResetTokenError, ResetPasswordUseCase } from './reset-password.use-case';
import { UserRepositoryPort } from '../../users/domain/user.repository.port';
import { PasswordHasherPort } from './password-hasher.port';

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
    setPasswordResetToken: jest.fn(),
    findByPasswordResetTokenHash: jest.fn(),
    resetPassword: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<UserRepositoryPort>;
}

const hasher: jest.Mocked<PasswordHasherPort> = {
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
};

const rawToken = 'raw-token-value';
const tokenHash = createHash('sha256').update(rawToken).digest('hex');

describe('ResetPasswordUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejette un jeton qui ne correspond à aucun utilisateur', async () => {
    const users = makeUsers({ findByPasswordResetTokenHash: jest.fn().mockResolvedValue(null) });
    const useCase = new ResetPasswordUseCase(users, hasher);

    await expect(useCase.execute(rawToken, 'NewP@ssword123!')).rejects.toBeInstanceOf(
      InvalidOrExpiredResetTokenError,
    );
    expect(users.findByPasswordResetTokenHash).toHaveBeenCalledWith(tokenHash);
    expect(users.resetPassword).not.toHaveBeenCalled();
  });

  it('rejette un jeton expiré', async () => {
    const expired = { id: 'u1', passwordResetTokenExpiresAt: new Date(Date.now() - 1000) } as any;
    const users = makeUsers({ findByPasswordResetTokenHash: jest.fn().mockResolvedValue(expired) });
    const useCase = new ResetPasswordUseCase(users, hasher);

    await expect(useCase.execute(rawToken, 'NewP@ssword123!')).rejects.toBeInstanceOf(
      InvalidOrExpiredResetTokenError,
    );
    expect(users.resetPassword).not.toHaveBeenCalled();
  });

  it('met à jour le mot de passe (haché) pour un jeton valide', async () => {
    const found = { id: 'u1', passwordResetTokenExpiresAt: new Date(Date.now() + 60_000) } as any;
    const users = makeUsers({ findByPasswordResetTokenHash: jest.fn().mockResolvedValue(found) });
    const useCase = new ResetPasswordUseCase(users, hasher);

    await useCase.execute(rawToken, 'NewP@ssword123!');

    expect(hasher.hash).toHaveBeenCalledWith('NewP@ssword123!');
    expect(users.resetPassword).toHaveBeenCalledWith('u1', 'hashed-password');
  });
});
