// Fonte única do tempo de expiração. O login devolve `expires_in`
// e o front usa esse valor no maxAge do cookie.
export const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 8; // 8h
