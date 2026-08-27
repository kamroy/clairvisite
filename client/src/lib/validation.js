// Format français : 0X XX XX XX XX ou +33 X XX XX XX XX, séparateurs espace/point/tiret
// optionnels — miroir de FRENCH_PHONE_REGEX côté serveur
// (server/src/common/validators/french-phone.ts). Sans ancres ^$ : l'attribut HTML
// pattern ancre déjà implicitement toute la valeur.
export const FRENCH_PHONE_PATTERN = "(?:\\+33\\s?|0)[1-9](?:[\\s.-]?\\d{2}){4}";

export const FRENCH_PHONE_TITLE = "Numéro de téléphone français, ex. 06 11 22 33 44 ou +33 6 11 22 33 44";

const PHONE_REGEX = new RegExp(`^(?:${FRENCH_PHONE_PATTERN})$`);
// Vérification de forme basique pour le retour visuel immédiat (surlignage au blur) —
// le serveur reste la source de vérité (IsEmail de class-validator, plus complet).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidFrenchPhone(value) {
  return PHONE_REGEX.test(value);
}

export function isValidEmail(value) {
  return EMAIL_REGEX.test(value);
}

// Miroir de PASSWORD_* côté serveur (server/src/common/validators/password-strength.ts).
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_PATTERN = "(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{12,72}";
export const PASSWORD_TITLE =
  "12 caractères minimum, avec au moins une majuscule et un caractère spécial";

const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

export function isValidPassword(value) {
  return (
    value.length >= PASSWORD_MIN_LENGTH &&
    PASSWORD_UPPERCASE_REGEX.test(value) &&
    PASSWORD_SPECIAL_CHAR_REGEX.test(value)
  );
}
