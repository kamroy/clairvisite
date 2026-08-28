// SIRET français : exactement 14 chiffres (SIREN 9 chiffres + NIC 5 chiffres).
// Pas de vérification de la clé de Luhn ici : suffisant pour un contrôle de saisie,
// la validité réelle sera de toute façon vérifiée par un humain (admin) à la validation.
export const SIRET_REGEX = /^\d{14}$/;

export const SIRET_MESSAGE = 'Numéro SIRET invalide (14 chiffres attendus)';
