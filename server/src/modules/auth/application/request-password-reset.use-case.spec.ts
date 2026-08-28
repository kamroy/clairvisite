import { RequestPasswordResetUseCase } from './request-password-reset.use-case';
import { UserRepositoryPort } from '../../users/domain/user.repository.port';
import { PasswordResetNotifierPort } from './ports/password-reset-notifier.port';

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
    setPasswordResetToken: jest.fn().mockResolvedValue(undefined),
    findByPasswordResetTokenHash: jest.fn(),
    resetPassword: jest.fn(),
    ...overrides,
  } as jest.Mocked<UserRepositoryPort>;
}

const resetBaseUrl = 'http://localhost:5173/reset-password';

describe('RequestPasswordResetUseCase', () => {
  let notifier: jest.Mocked<PasswordResetNotifierPort>;

  beforeEach(() => {
    notifier = { sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined) };
  });

  // Anti-enumeration : ces deux cas ne doivent renvoyer aucun signal observable
  // différent d'un envoi réussi, pour ne pas laisser deviner si un email existe ou
  // appartient à un compte Google (sans mot de passe à réinitialiser).
  it("ne fait rien si l'email n'existe pas", async () => {
    const users = makeUsers({ findByEmail: jest.fn().mockResolvedValue(null) });
    const useCase = new RequestPasswordResetUseCase(users, notifier);

    await useCase.execute('unknown@example.com', resetBaseUrl);

    expect(notifier.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('ne fait rien pour un compte Google (rien à réinitialiser)', async () => {
    const users = makeUsers({
      findByEmail: jest.fn().mockResolvedValue({ id: 'u1', authProvider: 'google' } as any),
    });
    const useCase = new RequestPasswordResetUseCase(users, notifier);

    await useCase.execute('user@example.com', resetBaseUrl);

    expect(notifier.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('génère un jeton et envoie l’email pour un compte password existant', async () => {
    const user = { id: 'u1', email: 'user@example.com', fullName: 'User', authProvider: 'password' } as any;
    const users = makeUsers({ findByEmail: jest.fn().mockResolvedValue(user) });
    const useCase = new RequestPasswordResetUseCase(users, notifier);

    await useCase.execute('user@example.com', resetBaseUrl);

    expect(users.setPasswordResetToken).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ tokenHash: expect.any(String), expiresAt: expect.any(Date) }),
    );
    expect(notifier.sendPasswordResetEmail).toHaveBeenCalledWith(user, expect.stringContaining(`${resetBaseUrl}?token=`));
  });
});
