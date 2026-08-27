import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { FRENCH_PHONE_MESSAGE, FRENCH_PHONE_REGEX } from '../../../../common/validators/french-phone';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_SPECIAL_CHAR_MESSAGE,
  PASSWORD_SPECIAL_CHAR_REGEX,
  PASSWORD_UPPERCASE_MESSAGE,
  PASSWORD_UPPERCASE_REGEX,
} from '../../../../common/validators/password-strength';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_UPPERCASE_REGEX, { message: PASSWORD_UPPERCASE_MESSAGE })
  @Matches(PASSWORD_SPECIAL_CHAR_REGEX, { message: PASSWORD_SPECIAL_CHAR_MESSAGE })
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @Matches(FRENCH_PHONE_REGEX, { message: FRENCH_PHONE_MESSAGE })
  phone?: string;

  @IsOptional()
  @IsIn(['acheteur', 'technicien'])
  role?: 'acheteur' | 'technicien';
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}
