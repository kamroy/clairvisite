import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ADMIN_ROLE_REPOSITORY, AdminRoleRepositoryPort } from '../../domain/admin-role.repository.port';
import { USER_REPOSITORY, UserRepositoryPort } from '../../../users/domain/user.repository.port';

@Injectable()
export class DeleteAdminRoleUseCase {
  constructor(
    @Inject(ADMIN_ROLE_REPOSITORY) private readonly roles: AdminRoleRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
  ) {}

  async execute(actorId: string, actorName: string, roleId: string) {
    const role = await this.roles.findById(roleId);
    if (!role) throw new NotFoundException('Rôle introuvable.');
    if (role.isSystem) throw new ForbiddenException('Le rôle Super Admin ne peut pas être supprimé.');

    const admins = await this.users.findAllByRole('admin');
    if (admins.some((a) => a.adminRoleId === roleId)) {
      throw new ConflictException('Réassignez les administrateurs de ce rôle avant de le supprimer.');
    }

    await this.roles.delete(roleId);
    await this.roles.appendAuditLog({
      actorId,
      actorName,
      action: 'role.deleted',
      targetType: 'admin_role',
      targetId: roleId,
      metadata: { name: role.name },
    });
  }
}
