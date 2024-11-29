class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', data = {}) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.data = data;
        this.timestamp = new Date();
        this.isOperational = true; // Per distinguere errori operazionali vs programmazione

        // Cattura stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            error: {
                message: this.message,
                code: this.code,
                statusCode: this.statusCode,
                data: this.data,
                timestamp: this.timestamp,
                stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
            }
        };
    }

    static isOperationalError(error) {
        if (error instanceof AppError) {
            return error.isOperational;
        }
        return false;
    }

    static isTrustedError(error) {
        if (error instanceof AppError) {
            return error.isOperational;
        }
        return false;
    }

    static badRequest(message, data = {}) {
        return new AppError(message, 400, 'BAD_REQUEST', data);
    }

    static unauthorized(message = 'Non autorizzato', data = {}) {
        return new AppError(message, 401, 'UNAUTHORIZED', data);
    }

    static forbidden(message = 'Accesso negato', data = {}) {
        return new AppError(message, 403, 'FORBIDDEN', data);
    }

    static notFound(message = 'Risorsa non trovata', data = {}) {
        return new AppError(message, 404, 'NOT_FOUND', data);
    }

    static conflict(message, data = {}) {
        return new AppError(message, 409, 'CONFLICT', data);
    }

    static validation(message = 'Errore di validazione', data = {}) {
        return new AppError(message, 422, 'VALIDATION_ERROR', data);
    }

    static tooManyRequests(message = 'Troppe richieste', data = {}) {
        return new AppError(message, 429, 'TOO_MANY_REQUESTS', data);
    }
}

export default AppError;