import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PhotoRole, SystemStatus } from '../../domain/report.entity';

const SYSTEM_STATUSES: SystemStatus[] = ['good', 'medium', 'critical'];
const PHOTO_ROLES: PhotoRole[] = ['before', 'after'];

export class UpdateReportConclusionDto {
  @IsString()
  @MaxLength(5000)
  general_conclusion: string;
}

export class UpdateReportSectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsIn(SYSTEM_STATUSES)
  status?: SystemStatus;
}

export class RequestReportPhotoUploadUrlDto {
  @IsString()
  @MaxLength(255)
  file_name: string;

  @IsString()
  @MaxLength(100)
  content_type: string;
}

export class AttachReportPhotoDto {
  @IsString()
  @MaxLength(500)
  key: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;

  @IsOptional()
  @IsIn(PHOTO_ROLES)
  role?: PhotoRole;
}
