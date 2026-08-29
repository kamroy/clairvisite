import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_ROLE_REPOSITORY, AdminRoleRepositoryPort } from '../../domain/admin-role.repository.port';

@Injectable()
export class ListAuditLogUseCase {
  constructor(@Inject(ADMIN_ROLE_REPOSITORY) private readonly roles: AdminRoleRepositoryPort) {}

  execute(page: number, pageSize: number) {
    return this.roles.listAuditLog(page, pageSize);
  }
}
