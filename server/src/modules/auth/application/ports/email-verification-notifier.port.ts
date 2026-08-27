export const EMAIL_VERIFICATION_NOTIFIER = Symbol('EMAIL_VERIFICATION_NOTIFIER');

export interface EmailVerificationNotifierPort {
  sendVerificationEmail(user: { email: string; fullName: string }, verificationUrl: string): Promise<void>;
}
