import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { AuthProvider, User } from '../domain/user.entity';
import {
  CreateUserData,
  SetEmailVerificationTokenData,
  UpdateUserProfileData,
  UserRepositoryPort,
} from '../domain/user.repository.port';

function toDomain(row: any): User {
  return new User(
    row.id,
    row.email,
    row.fullName,
    row.role,
    row.authProvider,
    row.passwordHash,
    row.oidcSubject,
    row.avatarUrl,
    row.phone,
    row.emailVerifiedAt,
    row.emailVerificationTokenExpiresAt,
  );
}

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.user.findMany({ where: { id: { in: ids } } });
    return rows.map(toDomain);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? toDomain(row) : null;
  }

  async findByOidcSubject(authProvider: AuthProvider, oidcSubject: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { authProvider_oidcSubject: { authProvider, oidcSubject } },
    });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const row = await this.prisma.user.create({ data });
    return toDomain(row);
  }

  async updateProfile(id: string, data: UpdateUserProfileData): Promise<User> {
    const row = await this.prisma.user.update({ where: { id }, data });
    return toDomain(row);
  }

  async setEmailVerificationToken(userId: string, data: SetEmailVerificationTokenData): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerificationTokenHash: data.tokenHash, emailVerificationTokenExpiresAt: data.expiresAt },
    });
  }

  async findByEmailVerificationTokenHash(tokenHash: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({ where: { emailVerificationTokenHash: tokenHash } });
    return row ? toDomain(row) : null;
  }

  async markEmailVerified(userId: string): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null,
      },
    });
    return toDomain(row);
  }
}
