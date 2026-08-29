import { PageResult } from '../../../common/pagination';
import { AdminRole, AuditLogEntry } from './admin-role.entity';
import { PermissionKey } from './permission-catalog';

export const ADMIN_ROLE_REPOSITORY = Symbol('ADMIN_ROLE_REPOSITORY');

export interface CreateAdminRoleData {
  name: string;
  permissions: PermissionKey[];
  isSystem?: boolean;
}

export interface AppendAuditLogData {
  actorId: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
}

export interface AdminRoleRepositoryPort {
  findAll(): Promise<AdminRole[]>;
  findById(id: string): Promise<AdminRole | null>;
  findByName(name: string): Promise<AdminRole | null>;
  create(data: CreateAdminRoleData): Promise<AdminRole>;
  updatePermissions(id: string, permissions: PermissionKey[]): Promise<AdminRole>;
  delete(id: string): Promise<void>;

  appendAuditLog(data: AppendAuditLogData): Promise<void>;
  listAuditLog(page: number, pageSize: number): Promise<PageResult<AuditLogEntry>>;
}
