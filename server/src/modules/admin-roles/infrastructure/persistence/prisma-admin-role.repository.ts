import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service';
import { toPageResult } from '../../../../common/pagination';
import { AdminRole, AuditLogEntry } from '../../domain/admin-role.entity';
import {
  AdminRoleRepositoryPort,
  AppendAuditLogData,
  CreateAdminRoleData,
} from '../../domain/admin-role.repository.port';
import { PermissionKey } from '../../domain/permission-catalog';

function toDomain(row: any): AdminRole {
  return new AdminRole(row.id, row.name, row.permissions as PermissionKey[], row.isSystem, row.createdAt, row.updatedAt);
}

function auditToDomain(row: any): AuditLogEntry {
  return new AuditLogEntry(
    row.id,
    row.actorId,
    row.actorName,
    row.action,
    row.targetType,
    row.targetId,
    row.metadata,
    row.createdAt,
  );
}

@Injectable()
export class PrismaAdminRoleRepository implements AdminRoleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AdminRole[]> {
    const rows = await this.prisma.adminRole.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<AdminRole | null> {
    const row = await this.prisma.adminRole.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByName(name: string): Promise<AdminRole | null> {
    const row = await this.prisma.adminRole.findUnique({ where: { name } });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateAdminRoleData): Promise<AdminRole> {
    const row = await this.prisma.adminRole.create({
      data: { name: data.name, permissions: data.permissions, isSystem: data.isSystem ?? false },
    });
    return toDomain(row);
  }

  async updatePermissions(id: string, permissions: PermissionKey[]): Promise<AdminRole> {
    const row = await this.prisma.adminRole.update({ where: { id }, data: { permissions } });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.adminRole.delete({ where: { id } });
  }

  async appendAuditLog(data: AppendAuditLogData): Promise<void> {
    await this.prisma.adminAuditLogEntry.create({
      data: {
        actorId: data.actorId,
        actorName: data.actorName,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async listAuditLog(page: number, pageSize: number) {
    const rows = await this.prisma.adminAuditLogEntry.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize + 1,
    });
    return toPageResult(rows.map(auditToDomain), page, pageSize);
  }
}
