import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ADMIN_ROLE_REPOSITORY, AdminRoleRepositoryPort } from '../../domain/admin-role.repository.port';
import { USER_REPOSITORY, UserRepositoryPort } from '../../../users/domain/user.repository.port';

@Injectable()
export class AssignAdminRoleUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(ADMIN_ROLE_REPOSITORY) private readonly roles: AdminRoleRepositoryPort,
  ) {}

  // adminRoleId = null réassigne au rôle Super Admin implicite (voir ListAdminRolesUseCase).
  async execute(actorId: string, actorName: string, userId: string, adminRoleId: string | null) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    if (user.role !== 'admin') throw new BadRequestException("Cet utilisateur n'a pas de rôle admin.");

    if (adminRoleId) {
      const role = await this.roles.findById(adminRoleId);
      if (!role) throw new NotFoundException('Rôle introuvable.');
    }

    const updated = await this.users.setAdminRoleId(userId, adminRoleId);
    await this.roles.appendAuditLog({
      actorId,
      actorName,
      action: 'user.role_assigned',
      targetType: 'user',
      targetId: userId,
      metadata: { adminRoleId },
    });
    return updated;
  }
}
