import { randomUUID } from 'crypto';
import { AdminRole, AuditLogEntry } from '../../src/modules/admin-roles/domain/admin-role.entity';
import {
  AdminRoleRepositoryPort,
  AppendAuditLogData,
  CreateAdminRoleData,
} from '../../src/modules/admin-roles/domain/admin-role.repository.port';
import { PermissionKey } from '../../src/modules/admin-roles/domain/permission-catalog';
import { toPageResult } from '../../src/common/pagination';

export class InMemoryAdminRoleRepository implements AdminRoleRepositoryPort {
  private readonly roles = new Map<string, AdminRole>();
  private readonly auditLog: AuditLogEntry[] = [];

  async findAll(): Promise<AdminRole[]> {
    return [...this.roles.values()];
  }

  async findById(id: string): Promise<AdminRole | null> {
    return this.roles.get(id) ?? null;
  }

  async findByName(name: string): Promise<AdminRole | null> {
    return [...this.roles.values()].find((r) => r.name === name) ?? null;
  }

  async create(data: CreateAdminRoleData): Promise<AdminRole> {
    const now = new Date();
    const role = new AdminRole(randomUUID(), data.name, data.permissions, data.isSystem ?? false, now, now);
    this.roles.set(role.id, role);
    return role;
  }

  async updatePermissions(id: string, permissions: PermissionKey[]): Promise<AdminRole> {
    const existing = this.roles.get(id);
    if (!existing) throw new Error(`InMemoryAdminRoleRepository: role ${id} not found`);
    const updated = new AdminRole(existing.id, existing.name, permissions, existing.isSystem, existing.createdAt, new Date());
    this.roles.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.roles.delete(id);
  }

  async appendAuditLog(data: AppendAuditLogData): Promise<void> {
    this.auditLog.unshift(
      new AuditLogEntry(
        randomUUID(),
        data.actorId,
        data.actorName,
        data.action,
        data.targetType,
        data.targetId,
        data.metadata ?? null,
        new Date(),
      ),
    );
  }

  async listAuditLog(page: number, pageSize: number) {
    const start = (page - 1) * pageSize;
    return toPageResult(this.auditLog.slice(start, start + pageSize + 1), page, pageSize);
  }
}
