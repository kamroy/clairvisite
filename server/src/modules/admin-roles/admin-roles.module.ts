import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminRolesController } from './infrastructure/http/admin-roles.controller';
import { ADMIN_ROLE_REPOSITORY } from './domain/admin-role.repository.port';
import { PrismaAdminRoleRepository } from './infrastructure/persistence/prisma-admin-role.repository';
import { ListAdminRolesUseCase } from './application/use-cases/list-admin-roles.use-case';
import { CreateAdminRoleUseCase } from './application/use-cases/create-admin-role.use-case';
import { UpdateAdminRolePermissionsUseCase } from './application/use-cases/update-admin-role-permissions.use-case';
import { CloneAdminRoleUseCase } from './application/use-cases/clone-admin-role.use-case';
import { DeleteAdminRoleUseCase } from './application/use-cases/delete-admin-role.use-case';
import { ListAdminUsersUseCase } from './application/use-cases/list-admin-users.use-case';
import { AssignAdminRoleUseCase } from './application/use-cases/assign-admin-role.use-case';
import { ListAuditLogUseCase } from './application/use-cases/list-audit-log.use-case';

// Module séparé de l'AdminModule existant (validation technicien) plutôt que fusionné
// dedans : évite de casser l'isolation DI d'admin.e2e-spec.ts (qui n'override que
// TECHNICIAN/BOOKING/USER_REPOSITORY + BOOKING_EMAIL_NOTIFIER) et garde la RBAC comme
// un bounded context à part avec son propre e2e-spec.
@Module({
  imports: [UsersModule],
  controllers: [AdminRolesController],
  providers: [
    ListAdminRolesUseCase,
    CreateAdminRoleUseCase,
    UpdateAdminRolePermissionsUseCase,
    CloneAdminRoleUseCase,
    DeleteAdminRoleUseCase,
    ListAdminUsersUseCase,
    AssignAdminRoleUseCase,
    ListAuditLogUseCase,
    { provide: ADMIN_ROLE_REPOSITORY, useClass: PrismaAdminRoleRepository },
  ],
})
export class AdminRolesModule {}
