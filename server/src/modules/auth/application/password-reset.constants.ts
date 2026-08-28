// Plus court que EMAIL_VERIFICATION_TOKEN_TTL_MS (24h) : un lien de réinitialisation de
// mot de passe est plus sensible (permet de prendre le contrôle du compte) et n'a pas
// besoin de rester valable aussi longtemps qu'un lien de confirmation d'inscription.
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
