// Format français : 0X XX XX XX XX ou +33 X XX XX XX XX (le 0 initial disparaît après
// +33), séparateurs espace/point/tiret optionnels entre les groupes de deux chiffres.
// Miroir de FRENCH_PHONE_PATTERN côté client (client/src/lib/validation.js).
export const FRENCH_PHONE_REGEX = /^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/;

export const FRENCH_PHONE_MESSAGE = 'Numéro de téléphone invalide (format français attendu)';
