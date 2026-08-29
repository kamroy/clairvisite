import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { ListAdminRolesUseCase } from '../../application/use-cases/list-admin-roles.use-case';
import { CreateAdminRoleUseCase } from '../../application/use-cases/create-admin-role.use-case';
import { UpdateAdminRolePermissionsUseCase } from '../../application/use-cases/update-admin-role-permissions.use-case';
import { CloneAdminRoleUseCase } from '../../application/use-cases/clone-admin-role.use-case';
import { DeleteAdminRoleUseCase } from '../../application/use-cases/delete-admin-role.use-case';
import { ListAdminUsersUseCase } from '../../application/use-cases/list-admin-users.use-case';
import { AssignAdminRoleUseCase } from '../../application/use-cases/assign-admin-role.use-case';
import { ListAuditLogUseCase } from '../../application/use-cases/list-audit-log.use-case';
import { PERMISSION_GROUPS } from '../../domain/permission-catalog';
import { AssignAdminRoleDto, CloneAdminRoleDto, CreateAdminRoleDto, UpdateAdminRolePermissionsDto } from './admin-roles.dto';

// Toutes les permissions granulaires sont stockées et assignables ici, mais aucun
// endpoint (existant ou nouveau) ne les consulte encore pour autoriser une action :
// tout reste gated par le rôle grossier `role: 'admin'`, comme le reste du backoffice.
// Retrofiter chaque endpoint admin pour consulter une permission précise est un futur
// chantier, une fois qu'il existe de vrais flux différenciés (finance, support) à
// protéger — voir 09-administration-backoffice.md.
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminRolesController {
  constructor(
    private readonly listRoles: ListAdminRolesUseCase,
    private readonly createRole: CreateAdminRoleUseCase,
    private readonly updatePermissions: UpdateAdminRolePermissionsUseCase,
    private readonly cloneRole: CloneAdminRoleUseCase,
    private readonly deleteRole: DeleteAdminRoleUseCase,
    private readonly listAdmins: ListAdminUsersUseCase,
    private readonly assignRole: AssignAdminRoleUseCase,
    private readonly listAuditLog: ListAuditLogUseCase,
  ) {}

  @Get('permissions')
  permissions() {
    return PERMISSION_GROUPS;
  }

  @Get('roles')
  roles() {
    return this.listRoles.execute();
  }

  @Post('roles')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAdminRoleDto) {
    return this.createRole.execute(user.sub, user.email, dto.name, dto.permissions);
  }

  @Patch('roles/:id/permissions')
  updatePerms(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAdminRolePermissionsDto,
  ) {
    return this.updatePermissions.execute(user.sub, user.email, id, dto.permissions);
  }

  @Post('roles/:id/clone')
  clone(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: CloneAdminRoleDto) {
    return this.cloneRole.execute(user.sub, user.email, id, dto.name);
  }

  @Delete('roles/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deleteRole.execute(user.sub, user.email, id);
  }

  @Get('admins')
  admins() {
    return this.listAdmins.execute();
  }

  @Patch('admins/:id/role')
  assign(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: AssignAdminRoleDto) {
    return this.assignRole.execute(user.sub, user.email, id, dto.admin_role_id ?? null);
  }

  @Get('audit-log')
  auditLog(@Query() pagination: PaginationQueryDto) {
    return this.listAuditLog.execute(pagination.page, pagination.pageSize);
  }
}
