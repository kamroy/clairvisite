import { randomUUID } from 'crypto';
import { User } from '../../src/modules/users/domain/user.entity';
import {
  CreateUserData,
  SetEmailVerificationTokenData,
  SetPasswordResetTokenData,
  UpdateUserProfileData,
  UserRepositoryPort,
} from '../../src/modules/users/domain/user.repository.port';

// Double de test du port : mêmes garanties que l'adapter Prisma (unicité par email,
// lookup par sujet OIDC), sans base de données. Utilisé pour les tests d'intégration
// qui bootent de vrais controllers/guards/use-cases via Nest TestingModule.
export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly users = new Map<string, User>();
  private readonly verificationTokenHashes = new Map<string, string>(); // userId -> tokenHash
  private readonly passwordResetTokenHashes = new Map<string, string>(); // userId -> tokenHash

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return [...this.users.values()].filter((u) => ids.includes(u.id));
  }

  async findByEmail(email: string): Promise<User | null> {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }

  async findByOidcSubject(provider: string, subject: string): Promise<User | null> {
    return (
      [...this.users.values()].find((u) => u.authProvider === provider && u.oidcSubject === subject) ?? null
    );
  }

  async create(data: CreateUserData): Promise<User> {
    const user = new User(
      randomUUID(),
      data.email,
      data.fullName,
      data.role,
      data.authProvider,
      data.passwordHash ?? null,
      data.oidcSubject ?? null,
      data.avatarUrl ?? null,
      null,
      data.emailVerifiedAt ?? null,
      null,
      null,
    );
    this.users.set(user.id, user);
    return user;
  }

  async updateProfile(id: string, data: UpdateUserProfileData): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) throw new Error(`InMemoryUserRepository: user ${id} not found`);
    const updated = new User(
      existing.id,
      existing.email,
      existing.fullName,
      existing.role,
      existing.authProvider,
      existing.passwordHash,
      existing.oidcSubject,
      existing.avatarUrl,
      data.phone ?? existing.phone,
      existing.emailVerifiedAt,
      existing.emailVerificationTokenExpiresAt,
      existing.passwordResetTokenExpiresAt,
    );
    this.users.set(id, updated);
    return updated;
  }

  async setEmailVerificationToken(userId: string, data: SetEmailVerificationTokenData): Promise<void> {
    const existing = this.users.get(userId);
    if (!existing) throw new Error(`InMemoryUserRepository: user ${userId} not found`);
    this.verificationTokenHashes.set(userId, data.tokenHash);
    this.users.set(
      userId,
      new User(
        existing.id,
        existing.email,
        existing.fullName,
        existing.role,
        existing.authProvider,
        existing.passwordHash,
        existing.oidcSubject,
        existing.avatarUrl,
        existing.phone,
        existing.emailVerifiedAt,
        data.expiresAt,
        existing.passwordResetTokenExpiresAt,
      ),
    );
  }

  async findByEmailVerificationTokenHash(tokenHash: string): Promise<User | null> {
    for (const [userId, hash] of this.verificationTokenHashes) {
      if (hash === tokenHash) return this.users.get(userId) ?? null;
    }
    return null;
  }

  async markEmailVerified(userId: string): Promise<User> {
    const existing = this.users.get(userId);
    if (!existing) throw new Error(`InMemoryUserRepository: user ${userId} not found`);
    this.verificationTokenHashes.delete(userId);
    const updated = new User(
      existing.id,
      existing.email,
      existing.fullName,
      existing.role,
      existing.authProvider,
      existing.passwordHash,
      existing.oidcSubject,
      existing.avatarUrl,
      existing.phone,
      new Date(),
      null,
      existing.passwordResetTokenExpiresAt,
    );
    this.users.set(userId, updated);
    return updated;
  }

  async setPasswordResetToken(userId: string, data: SetPasswordResetTokenData): Promise<void> {
    const existing = this.users.get(userId);
    if (!existing) throw new Error(`InMemoryUserRepository: user ${userId} not found`);
    this.passwordResetTokenHashes.set(userId, data.tokenHash);
    this.users.set(
      userId,
      new User(
        existing.id,
        existing.email,
        existing.fullName,
        existing.role,
        existing.authProvider,
        existing.passwordHash,
        existing.oidcSubject,
        existing.avatarUrl,
        existing.phone,
        existing.emailVerifiedAt,
        existing.emailVerificationTokenExpiresAt,
        data.expiresAt,
      ),
    );
  }

  async findByPasswordResetTokenHash(tokenHash: string): Promise<User | null> {
    for (const [userId, hash] of this.passwordResetTokenHashes) {
      if (hash === tokenHash) return this.users.get(userId) ?? null;
    }
    return null;
  }

  async resetPassword(userId: string, passwordHash: string): Promise<void> {
    const existing = this.users.get(userId);
    if (!existing) throw new Error(`InMemoryUserRepository: user ${userId} not found`);
    this.passwordResetTokenHashes.delete(userId);
    this.users.set(
      userId,
      new User(
        existing.id,
        existing.email,
        existing.fullName,
        existing.role,
        existing.authProvider,
        passwordHash,
        existing.oidcSubject,
        existing.avatarUrl,
        existing.phone,
        existing.emailVerifiedAt,
        existing.emailVerificationTokenExpiresAt,
        null,
      ),
    );
  }

  seed(user: User): User {
    this.users.set(user.id, user);
    return user;
  }
}
