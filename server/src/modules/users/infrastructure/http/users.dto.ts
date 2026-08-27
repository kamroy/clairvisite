import { Matches } from 'class-validator';
import { FRENCH_PHONE_MESSAGE, FRENCH_PHONE_REGEX } from '../../../../common/validators/french-phone';

export class UpdateProfileDto {
  @Matches(FRENCH_PHONE_REGEX, { message: FRENCH_PHONE_MESSAGE })
  phone: string;
}
