import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_ROLE_REPOSITORY, AdminRoleRepositoryPort } from '../../domain/admin-role.repository.port';
import { ALL_PERMISSIONS } from '../../domain/permission-catalog';
import { SUPER_ADMIN_ROLE_NAME } from '../../domain/admin-role.entity';
import { USER_REPOSITORY, UserRepositoryPort } from '../../../users/domain/user.repository.port';

@Injectable()
export class ListAdminRolesUseCase {
  constructor(
    @Inject(ADMIN_ROLE_REPOSITORY) private readonly roles: AdminRoleRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
  ) {}

  async execute() {
    let roles = await this.roles.findAll();
    // Bootstrap paresseux (même schéma que get-or-create-technician-report) : le
    // rôle Super Admin n'existe pas tant que personne n'a ouvert cet écran — évite un
    // script de migration à part pour peupler les comptes admin existants.
    if (!roles.some((r) => r.isSystem)) {
      await this.roles.create({ name: SUPER_ADMIN_ROLE_NAME, permissions: ALL_PERMISSIONS, isSystem: true });
      roles = await this.roles.findAll();
    }

    const admins = await this.users.findAllByRole('admin');
    const counts = new Map<string, number>();
    for (const admin of admins) {
      const roleId = admin.adminRoleId ?? roles.find((r) => r.isSystem)!.id;
      counts.set(roleId, (counts.get(roleId) ?? 0) + 1);
    }

    return roles.map((role) => ({ ...role, userCount: counts.get(role.id) ?? 0 }));
  }
}
