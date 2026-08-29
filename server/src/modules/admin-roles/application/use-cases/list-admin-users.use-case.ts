import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_ROLE_REPOSITORY, AdminRoleRepositoryPort } from '../../domain/admin-role.repository.port';
import { SUPER_ADMIN_ROLE_NAME } from '../../domain/admin-role.entity';
import { USER_REPOSITORY, UserRepositoryPort } from '../../../users/domain/user.repository.port';

@Injectable()
export class ListAdminUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(ADMIN_ROLE_REPOSITORY) private readonly roles: AdminRoleRepositoryPort,
  ) {}

  async execute() {
    const [admins, roles] = await Promise.all([this.users.findAllByRole('admin'), this.roles.findAll()]);
    const superAdmin = roles.find((r) => r.isSystem);

    return admins.map((admin) => {
      const role = admin.adminRoleId ? roles.find((r) => r.id === admin.adminRoleId) : superAdmin;
      return {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        adminRoleId: role?.id ?? null,
        adminRoleName: role?.name ?? SUPER_ADMIN_ROLE_NAME,
      };
    });
  }
}
