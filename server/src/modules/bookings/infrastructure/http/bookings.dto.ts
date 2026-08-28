import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { FRENCH_PHONE_MESSAGE, FRENCH_PHONE_REGEX } from '../../../../common/validators/french-phone';
import { PropertyType } from '../../domain/booking.entity';

const PROPERTY_TYPES: PropertyType[] = ['apartment', 'house'];

export class CreateBookingDto {
  @IsUUID()
  availability_id: string;

  @Matches(FRENCH_PHONE_REGEX, { message: FRENCH_PHONE_MESSAGE })
  buyer_phone: string;

  @IsString()
  @MaxLength(300)
  property_address: string;

  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  property_type?: PropertyType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  surface_m2?: number;
}
