import { IsDateString, IsOptional } from 'class-validator';

export class CreateAvailabilityDto {
  @IsDateString()
  startDatetime: string;

  @IsDateString()
  endDatetime: string;
}

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsDateString()
  startDatetime?: string;

  @IsOptional()
  @IsDateString()
  endDatetime?: string;
}
