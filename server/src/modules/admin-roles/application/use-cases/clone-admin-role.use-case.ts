import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ADMIN_ROLE_REPOSITORY, AdminRoleRepositoryPort } from '../../domain/admin-role.repository.port';

@Injectable()
export class CloneAdminRoleUseCase {
  constructor(@Inject(ADMIN_ROLE_REPOSITORY) private readonly roles: AdminRoleRepositoryPort) {}

  async execute(actorId: string, actorName: string, roleId: string, newName: string) {
    const source = await this.roles.findById(roleId);
    if (!source) throw new NotFoundException('Rôle introuvable.');
    if (await this.roles.findByName(newName)) throw new ConflictException('Un rôle porte déjà ce nom.');

    const clone = await this.roles.create({ name: newName, permissions: source.permissions });
    await this.roles.appendAuditLog({
      actorId,
      actorName,
      action: 'role.cloned',
      targetType: 'admin_role',
      targetId: clone.id,
      metadata: { sourceRoleId: roleId, name: newName },
    });
    return clone;
  }
}
