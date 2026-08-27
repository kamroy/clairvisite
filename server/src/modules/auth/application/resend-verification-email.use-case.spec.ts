import { ResendVerificationEmailUseCase } from './resend-verification-email.use-case';
import { UserRepositoryPort } from '../../users/domain/user.repository.port';
import { EmailVerificationNotifierPort } from './ports/email-verification-notifier.port';

function makeUsers(overrides: Partial<UserRepositoryPort> = {}): jest.Mocked<UserRepositoryPort> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByOidcSubject: jest.fn(),
    create: jest.fn(),
    updateProfile: jest.fn(),
    setEmailVerificationToken: jest.fn().mockResolvedValue(undefined),
    findByEmailVerificationTokenHash: jest.fn(),
    markEmailVerified: jest.fn(),
    ...overrides,
  } as jest.Mocked<UserRepositoryPort>;
}

const verifyBaseUrl = 'http://localhost:3000/api/auth/verify-email';

describe('ResendVerificationEmailUseCase', () => {
  let notifier: jest.Mocked<EmailVerificationNotifierPort>;

  beforeEach(() => {
    notifier = { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) };
  });

  // Anti-enumeration : ces trois cas ne doivent renvoyer aucune erreur ni signal
  // observable différent d'un renvoi réussi, pour ne pas laisser deviner si un email
  // existe, est déjà vérifié, ou appartient à un compte Google.
  it("ne fait rien si l'email n'existe pas", async () => {
    const users = makeUsers({ findByEmail: jest.fn().mockResolvedValue(null) });
    const useCase = new ResendVerificationEmailUseCase(users, notifier);

    await useCase.execute('unknown@example.com', verifyBaseUrl);

    expect(notifier.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('ne fait rien si le compte est déjà vérifié', async () => {
    const users = makeUsers({
      findByEmail: jest.fn().mockResolvedValue({ id: 'u1', authProvider: 'password', emailVerifiedAt: new Date() } as any),
    });
    const useCase = new ResendVerificationEmailUseCase(users, notifier);

    await useCase.execute('user@example.com', verifyBaseUrl);

    expect(notifier.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("ne fait rien pour un compte Google (rien à vérifier)", async () => {
    const users = makeUsers({
      findByEmail: jest.fn().mockResolvedValue({ id: 'u1', authProvider: 'google', emailVerifiedAt: new Date() } as any),
    });
    const useCase = new ResendVerificationEmailUseCase(users, notifier);

    await useCase.execute('user@example.com', verifyBaseUrl);

    expect(notifier.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('régénère un jeton et renvoie l’email pour un compte password non vérifié', async () => {
    const user = { id: 'u1', email: 'user@example.com', fullName: 'User', authProvider: 'password', emailVerifiedAt: null } as any;
    const users = makeUsers({ findByEmail: jest.fn().mockResolvedValue(user) });
    const useCase = new ResendVerificationEmailUseCase(users, notifier);

    await useCase.execute('user@example.com', verifyBaseUrl);

    expect(users.setEmailVerificationToken).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ tokenHash: expect.any(String), expiresAt: expect.any(Date) }),
    );
    expect(notifier.sendVerificationEmail).toHaveBeenCalledWith(user, expect.stringContaining(`${verifyBaseUrl}?token=`));
  });
});
