import { IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { FRENCH_PHONE_MESSAGE, FRENCH_PHONE_REGEX } from '../../../../common/validators/french-phone';

export class CreateBookingDto {
  @IsUUID()
  availability_id: string;

  @Matches(FRENCH_PHONE_REGEX, { message: FRENCH_PHONE_MESSAGE })
  buyer_phone: string;

  @IsString()
  @MaxLength(300)
  property_address: string;
}
