export type Role = 'acheteur' | 'technicien' | 'admin';
export type AuthProvider = 'google' | 'password';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly fullName: string,
    public readonly role: Role,
    public readonly authProvider: AuthProvider,
    public readonly passwordHash: string | null = null,
    public readonly oidcSubject: string | null = null,
    public readonly avatarUrl: string | null = null,
    public readonly phone: string | null = null,
    public readonly emailVerifiedAt: Date | null = null,
    public readonly emailVerificationTokenExpiresAt: Date | null = null,
    public readonly passwordResetTokenExpiresAt: Date | null = null,
  ) {}
}
