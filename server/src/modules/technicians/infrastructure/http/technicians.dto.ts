import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { FRENCH_PHONE_MESSAGE, FRENCH_PHONE_REGEX } from '../../../../common/validators/french-phone';

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
}
