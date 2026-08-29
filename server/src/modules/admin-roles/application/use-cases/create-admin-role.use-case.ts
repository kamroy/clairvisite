import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { ADMIN_ROLE_REPOSITORY, AdminRoleRepositoryPort } from '../../domain/admin-role.repository.port';
import { isValidPermission, PermissionKey } from '../../domain/permission-catalog';

@Injectable()
export class CreateAdminRoleUseCase {
  constructor(@Inject(ADMIN_ROLE_REPOSITORY) private readonly roles: AdminRoleRepositoryPort) {}

  async execute(actorId: string, actorName: string, name: string, permissions: string[]) {
    const invalid = permissions.filter((p) => !isValidPermission(p));
    if (invalid.length > 0) throw new BadRequestException(`Permissions inconnues : ${invalid.join(', ')}`);

    if (await this.roles.findByName(name)) {
      throw new ConflictException('Un rôle porte déjà ce nom.');
    }

    const role = await this.roles.create({ name, permissions: permissions as PermissionKey[] });
    await this.roles.appendAuditLog({
      actorId,
      actorName,
      action: 'role.created',
      targetType: 'admin_role',
      targetId: role.id,
      metadata: { name, permissions },
    });
    return role;
  }
}
