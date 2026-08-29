import { ArrayUnique, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAdminRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissions: string[];
}

export class UpdateAdminRolePermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissions: string[];
}

export class CloneAdminRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;
}

// admin_role_id absent ou vide = réassigner au rôle Super Admin implicite (voir
// ListAdminRolesUseCase) — pas de valeur `null` explicite en JSON pour rester
// cohérent avec les autres DTOs optionnels de l'app (ex. SendMessageDto).
export class AssignAdminRoleDto {
  @IsOptional()
  @IsString()
  admin_role_id?: string;
}
