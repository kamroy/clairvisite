export const PASSWORD_RESET_NOTIFIER = Symbol('PASSWORD_RESET_NOTIFIER');

export interface PasswordResetNotifierPort {
  sendPasswordResetEmail(user: { email: string; fullName: string }, resetUrl: string): Promise<void>;
}
