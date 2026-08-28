import { AuthProvider, Role, User } from './user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface CreateUserData {
  email: string;
  fullName: string;
  role: Role;
  authProvider: AuthProvider;
  passwordHash?: string | null;
  oidcSubject?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  // Les comptes créés via Google sont considérés vérifiés d'office (Google a déjà
  // prouvé la propriété de l'email) ; les comptes email/mot de passe démarrent non
  // vérifiés et passent par le flux de validation par email.
  emailVerifiedAt?: Date | null;
}

export interface UpdateUserProfileData {
  phone?: string;
}

export interface SetEmailVerificationTokenData {
  tokenHash: string;
  expiresAt: Date;
}

export interface SetPasswordResetTokenData {
  tokenHash: string;
  expiresAt: Date;
}

// Port piloté (driven port) : implémenté par un adapter d'infrastructure (Prisma ici).
export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  findByOidcSubject(provider: AuthProvider, subject: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  updateProfile(id: string, data: UpdateUserProfileData): Promise<User>;

  setEmailVerificationToken(userId: string, data: SetEmailVerificationTokenData): Promise<void>;
  findByEmailVerificationTokenHash(tokenHash: string): Promise<User | null>;
  markEmailVerified(userId: string): Promise<User>;

  setPasswordResetToken(userId: string, data: SetPasswordResetTokenData): Promise<void>;
  findByPasswordResetTokenHash(tokenHash: string): Promise<User | null>;
  resetPassword(userId: string, passwordHash: string): Promise<void>;
}
