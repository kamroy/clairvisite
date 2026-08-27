export const PASSWORD_MIN_LENGTH = 12;
// bcrypt tronque silencieusement au-delà de 72 octets.
export const PASSWORD_MAX_LENGTH = 72;

export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
export const PASSWORD_SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

export const PASSWORD_UPPERCASE_MESSAGE = 'Le mot de passe doit contenir au moins une majuscule';
export const PASSWORD_SPECIAL_CHAR_MESSAGE = 'Le mot de passe doit contenir au moins un caractère spécial';
