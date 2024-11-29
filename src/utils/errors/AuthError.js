import AppError from './AppError.js';

class AuthError extends AppError {
    constructor(message, code = 'AUTH_ERROR', statusCode = 401, data = {}) {
        super(message, statusCode, code, data);
        this.name = 'AuthError';
    }

    static invalidToken(message = 'Token non valido o scaduto') {
        return new AuthError(message, 'INVALID_TOKEN', 401);
    }

    static missingToken(message = 'Token di accesso non fornito') {
        return new AuthError(message, 'MISSING_TOKEN', 401);
    }

    static invalidCredentials(message = 'Credenziali non valide') {
        return new AuthError(message, 'INVALID_CREDENTIALS', 401);
    }

    static accessDenied(message = 'Accesso negato') {
        return new AuthError(message, 'ACCESS_DENIED', 403);
    }

    static accountLocked(message = 'Account bloccato', data = {}) {
        return new AuthError(message, 'ACCOUNT_LOCKED', 403, data);
    }

    static tooManyAttempts(message = 'Troppi tentativi falliti', data = {}) {
        return new AuthError(message, 'TOO_MANY_ATTEMPTS', 429, data);
    }

    static sessionExpired(message = 'Sessione scaduta') {
        return new AuthError(message, 'SESSION_EXPIRED', 401);
    }

    static refreshTokenExpired(message = 'Refresh token scaduto') {
        return new AuthError(message, 'REFRESH_TOKEN_EXPIRED', 401);
    }

    static accountNotFound(message = 'Account non trovato') {
        return new AuthError(message, 'ACCOUNT_NOT_FOUND', 404);
    }

    toJSON() {
        const json = super.toJSON();
        if (this.code === 'TOO_MANY_ATTEMPTS' && this.data.remainingTime) {
            json.error.remainingTime = this.data.remainingTime;
        }
        return json;
    }

    static isAuthError(error) {
        return error instanceof AuthError;
    }
}

export default AuthError;