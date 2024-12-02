import AppError from './AppError.js';
import ValidationError from './ValidationError.js';
import DatabaseError from './DatabaseError.js';
import AuthError from './AuthError.js';
import logger from '../logger.js';
import { errorReporter } from '../errorReporting/errorReporter.js';
import { formatError } from '../errorReporting/errorFormatter.js';
import { SERVER_CONFIG } from '../../config/environments.js';

function handleDevelopmentError(err, req, res) {
    logger.error('Development Error:', {
        error: err,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers
    });

    const formattedError = formatError(err);
    return res.status(err.statusCode || 500).json(formattedError);
}

function handleProductionError(err, req, res) {
    // Log errore completo ma rispondi con meno dettagli
    logger.error('Production Error:', {
        message: err.message,
        code: err.code,
        type: err.name,
        path: req.path,
        method: req.method
    });

    if (AppError.isOperationalError(err)) {
        // Errori operazionali previsti
        const formattedError = formatError(err);
        delete formattedError.error.stack;
        return res.status(err.statusCode || 500).json(formattedError);
    }

    // Errori non operazionali/imprevisti
    return res.status(500).json({
        success: false,
        error: {
            message: 'Si è verificato un errore interno',
            code: 'INTERNAL_ERROR'
        }
    });
}

// Middleware di gestione errori globale
const errorHandler = async (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    // Conversione errori noti in AppError
    if (err.name === 'ValidationError') {
        err = ValidationError.fromExpressValidator(err);
    } else if (err.name === 'JsonWebTokenError') {
        err = AuthError.invalidToken();
    } else if (err.name === 'TokenExpiredError') {
        err = AuthError.sessionExpired();
    }

    // Report errori non operazionali
    if (!AppError.isOperationalError(err)) {
        await errorReporter.report(err, {
            request: {
                path: req.path,
                method: req.method,
                query: req.query,
                body: req.body,
                user: req.user?.id
            }
        });
    }

    // Gestione diversa in base all'ambiente
    if (SERVER_CONFIG.isDevelopment) {
        handleDevelopmentError(err, req, res);
    } else {
        handleProductionError(err, req, res);
    }
};

// Middleware per errori 404
const notFoundHandler = (req, res, next) => {
    const err = AppError.notFound(`Risorsa non trovata: ${req.originalUrl}`);
    next(err);
};

// Handler per promise non gestite
const unhandledRejectionHandler = (reason, promise) => {
    logger.error('Unhandled Rejection:', {
        reason,
        promise
    });

    // In produzione, log e continua
    if (SERVER_CONFIG.isProduction) {
        errorReporter.report(reason);
    } else {
        // In development, termina il processo
        process.exit(1);
    }
};

// Handler per eccezioni non gestite
const uncaughtExceptionHandler = (error) => {
    logger.error('Uncaught Exception:', error);

    // Report e termina sempre il processo per eccezioni non gestite
    errorReporter.report(error).finally(() => {
        process.exit(1);
    });
};

export {
    errorHandler,
    notFoundHandler,
    unhandledRejectionHandler,
    uncaughtExceptionHandler
};