import { PermissionKey } from './permission-catalog';

export const SUPER_ADMIN_ROLE_NAME = 'Super Admin';

export class AdminRole {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly permissions: PermissionKey[],
    public readonly isSystem: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

export class AuditLogEntry {
  constructor(
    public readonly id: string,
    public readonly actorId: string,
    public readonly actorName: string,
    public readonly action: string,
    public readonly targetType: string,
    public readonly targetId: string,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
  ) {}
}
