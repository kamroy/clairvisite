import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../../../common/decorators/current-user.decorator';
import { USER_REPOSITORY, UserRepositoryPort } from '../../../users/domain/user.repository.port';
import { RegisterUseCase } from '../../application/register.use-case';
import { LoginUseCase } from '../../application/login.use-case';
import { StartOidcLoginUseCase } from '../../application/start-oidc-login.use-case';
import { HandleOidcCallbackUseCase, OidcAccountConflictError } from '../../application/handle-oidc-callback.use-case';
import { VerifyEmailUseCase } from '../../application/verify-email.use-case';
import { ResendVerificationEmailUseCase } from '../../application/resend-verification-email.use-case';
import { RequestPasswordResetUseCase } from '../../application/request-password-reset.use-case';
import { ResetPasswordUseCase, InvalidOrExpiredResetTokenError } from '../../application/reset-password.use-case';
import { RegisterDto, LoginDto, ResendVerificationDto, ForgotPasswordDto, ResetPasswordDto } from './auth.dto';
import { BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { isProd, crossOriginCookieOptions } from '../../../../common/cookies/cookie-options';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly startOidcLogin: StartOidcLoginUseCase,
    private readonly handleOidcCallback: HandleOidcCallbackUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationEmail: ResendVerificationEmailUseCase,
    private readonly requestPasswordReset: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
  ) {}

  private verifyEmailBaseUrl(): string {
    return `${this.config.getOrThrow('API_BASE_URL')}/auth/verify-email`;
  }

  // Contrairement à verify-email (géré côté serveur par une redirection), la
  // réinitialisation affiche un formulaire (nouveau mot de passe) : le lien pointe donc
  // vers une page du client, pas vers l'API.
  private resetPasswordBaseUrl(): string {
    return `${this.config.getOrThrow('CLIENT_URL')}/reset-password`;
  }

  private setSessionCookie(res: Response, token: string) {
    res.cookie('session', token, {
      httpOnly: true,
      ...crossOriginCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto) {
    // Pas de cookie de session ici : le compte doit d'abord être confirmé par email
    // (voir RegisterUseCase / VerifyEmailUseCase).
    const { user } = await this.registerUseCase.execute(dto, this.verifyEmailBaseUrl());
    return { ...user, message: 'Un email de confirmation vous a été envoyé.' };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    const clientUrl = this.config.getOrThrow('CLIENT_URL');
    try {
      const sessionToken = await this.verifyEmailUseCase.execute(token);
      this.setSessionCookie(res, sessionToken);
      res.redirect(`${clientUrl}/login?verified=1`);
    } catch {
      res.redirect(`${clientUrl}/login?error=verification`);
    }
  }

  @Post('resend-verification')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.resendVerificationEmail.execute(dto.email, this.verifyEmailBaseUrl());
    return { message: 'Si un compte existe avec cet email, un lien de confirmation a été renvoyé.' };
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.requestPasswordReset.execute(dto.email, this.resetPasswordBaseUrl());
    return { message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' };
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    try {
      await this.resetPasswordUseCase.execute(dto.token, dto.password);
    } catch (err) {
      if (err instanceof InvalidOrExpiredResetTokenError) throw new BadRequestException(err.message);
      throw err;
    }
    return { message: 'Mot de passe mis à jour.' };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, sessionToken } = await this.loginUseCase.execute(dto.email, dto.password);
    this.setSessionCookie(res, sessionToken);
    return user;
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    // clearCookie doit recevoir les mêmes attributs qu'à la pose (path/secure/sameSite),
    // sinon le navigateur ne reconnaît pas le cookie à effacer et le laisse en place.
    res.clearCookie('session', crossOriginCookieOptions());
  }

  @Get('google')
  async googleLogin(@Res() res: Response) {
    const redirectUri = this.config.getOrThrow('GOOGLE_REDIRECT_URI');
    const { authorizationUrl, codeVerifier } = await this.startOidcLogin.execute(redirectUri);

    // Cookie posé/lu uniquement lors de navigations top-level (redirection OAuth), pas
    // d'un fetch() cross-site : `sameSite: 'lax'` suffit même en déploiement cross-origin.
    res.cookie('oidc_verifier', codeVerifier, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });
    res.redirect(authorizationUrl);
  }

  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const redirectUri = this.config.getOrThrow('GOOGLE_REDIRECT_URI');
    const clientUrl = this.config.getOrThrow('CLIENT_URL');

    try {
      const sessionToken = await this.handleOidcCallback.execute(
        req.originalUrl,
        redirectUri,
        req.cookies.oidc_verifier,
      );
      this.setSessionCookie(res, sessionToken);
      res.clearCookie('oidc_verifier', { sameSite: 'lax', secure: isProd });
      res.redirect(clientUrl); // page d'accueil publique (recherche), pas d'écran dédié nécessaire ici
    } catch (err) {
      if (err instanceof OidcAccountConflictError) {
        res.redirect(`${clientUrl}/login?error=oidc_account_exists`);
        return;
      }
      console.error('Erreur callback OIDC Google', err);
      res.redirect(`${clientUrl}/login?error=oidc`);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.users.findById(currentUser.sub);
    if (!user) return null;
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role, phone: user.phone };
  }
}
