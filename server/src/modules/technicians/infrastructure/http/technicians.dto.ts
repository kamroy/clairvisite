import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsEnum, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { FRENCH_PHONE_MESSAGE, FRENCH_PHONE_REGEX } from '../../../../common/validators/french-phone';
import { SIRET_MESSAGE, SIRET_REGEX } from '../../../../common/validators/siret';
import { TechnicianCategory } from '../../domain/technician.entity';

const TECHNICIAN_CATEGORIES: TechnicianCategory[] = ['technique', 'decoration', 'architecture'];

export class UpsertTechnicianProfileDto {
  @Matches(FRENCH_PHONE_REGEX, { message: FRENCH_PHONE_MESSAGE })
  phone: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  specialties: string[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(101)
  @IsString({ each: true })
  regions: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsEnum(TECHNICIAN_CATEGORIES)
  category?: TechnicianCategory;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @Matches(SIRET_REGEX, { message: SIRET_MESSAGE })
  siret?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(80)
  yearsOfExperience?: number;
}
