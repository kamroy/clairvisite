import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ADMIN_ROLE_REPOSITORY, AdminRoleRepositoryPort } from '../../domain/admin-role.repository.port';
import { isValidPermission, PermissionKey } from '../../domain/permission-catalog';

@Injectable()
export class UpdateAdminRolePermissionsUseCase {
  constructor(@Inject(ADMIN_ROLE_REPOSITORY) private readonly roles: AdminRoleRepositoryPort) {}

  async execute(actorId: string, actorName: string, roleId: string, permissions: string[]) {
    const role = await this.roles.findById(roleId);
    if (!role) throw new NotFoundException('Rôle introuvable.');
    // Le rôle Super Admin ne doit jamais pouvoir être vidé de ses permissions par erreur
    // (risque de verrouiller tout accès admin) — protection volontairement stricte.
    if (role.isSystem) throw new ForbiddenException('Les permissions du rôle Super Admin ne peuvent pas être modifiées.');

    const invalid = permissions.filter((p) => !isValidPermission(p));
    if (invalid.length > 0) throw new BadRequestException(`Permissions inconnues : ${invalid.join(', ')}`);

    const updated = await this.roles.updatePermissions(roleId, permissions as PermissionKey[]);
    await this.roles.appendAuditLog({
      actorId,
      actorName,
      action: 'role.permissions_updated',
      targetType: 'admin_role',
      targetId: roleId,
      metadata: { permissions },
    });
    return updated;
  }
}
