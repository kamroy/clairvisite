import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthController } from './infrastructure/http/auth.controller';
import { RegisterUseCase } from './application/register.use-case';
import { LoginUseCase } from './application/login.use-case';
import { StartOidcLoginUseCase } from './application/start-oidc-login.use-case';
import { HandleOidcCallbackUseCase } from './application/handle-oidc-callback.use-case';
import { VerifyEmailUseCase } from './application/verify-email.use-case';
import { ResendVerificationEmailUseCase } from './application/resend-verification-email.use-case';
import { RequestPasswordResetUseCase } from './application/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/reset-password.use-case';
import { PASSWORD_HASHER } from './application/password-hasher.port';
import { SESSION_TOKEN_ISSUER } from './application/session-token-issuer.port';
import { OIDC_PROVIDER } from './application/oidc-provider.port';
import { EMAIL_VERIFICATION_NOTIFIER } from './application/ports/email-verification-notifier.port';
import { PASSWORD_RESET_NOTIFIER } from './application/ports/password-reset-notifier.port';
import { BcryptPasswordHasher } from './infrastructure/adapters/bcrypt-password-hasher.adapter';
import { JwtSessionTokenIssuer } from './infrastructure/adapters/jwt-session-token.adapter';
import { GoogleOidcAdapter } from './infrastructure/adapters/google-oidc.adapter';
import { ResendEmailVerificationNotifier } from './infrastructure/adapters/resend-email-verification-notifier.adapter';
import { ResendPasswordResetNotifier } from './infrastructure/adapters/resend-password-reset-notifier.adapter';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      global: true, // JwtAuthGuard est utilisé par d'autres modules (bookings, availabilities, ...)
      // qui ne dépendent pas d'AuthModule : sans `global`, Nest ne peut pas résoudre
      // JwtService pour eux et l'application ne démarre pas (UnknownDependenciesException).
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.getOrThrow('JWT_SECRET') }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    StartOidcLoginUseCase,
    HandleOidcCallbackUseCase,
    VerifyEmailUseCase,
    ResendVerificationEmailUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: SESSION_TOKEN_ISSUER, useClass: JwtSessionTokenIssuer },
    { provide: OIDC_PROVIDER, useClass: GoogleOidcAdapter },
    { provide: EMAIL_VERIFICATION_NOTIFIER, useClass: ResendEmailVerificationNotifier },
    { provide: PASSWORD_RESET_NOTIFIER, useClass: ResendPasswordResetNotifier },
  ],
})
export class AuthModule {}
