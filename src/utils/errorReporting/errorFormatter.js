import AppError from '../errors/AppError.js';
import ValidationError from '../errors/ValidationError.js';
import DatabaseError from '../errors/DatabaseError.js';
import AuthError from '../errors/AuthError.js';
import { SERVER_CONFIG } from '../../config/environments.js';

export function formatError(error) {
    // Se è già un AppError, usa il suo formato
    if (error instanceof AppError) {
        return error.toJSON();
    }

    // Formatta errori nativi di Express/Node
    if (error instanceof SyntaxError) {
        return {
            success: false,
            error: {
                message: 'Errore di sintassi nella richiesta',
                code: 'SYNTAX_ERROR',
                statusCode: 400,
                details: SERVER_CONFIG.isDevelopment ? error.message : undefined
            }
        };
    }

    if (error instanceof URIError) {
        return {
            success: false,
            error: {
                message: 'URI non valido',
                code: 'URI_ERROR',
                statusCode: 400
            }
        };
    }

    if (error instanceof ReferenceError || error instanceof TypeError) {
        return {
            success: false,
            error: {
                message: 'Errore interno del server',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                stack: SERVER_CONFIG.isDevelopment ? error.stack : undefined
            }
        };
    }

    // Errori di rete
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        return {
            success: false,
            error: {
                message: 'Errore di connessione',
                code: 'CONNECTION_ERROR',
                statusCode: 503
            }
        };
    }

    // Formato di default per errori sconosciuti
    return {
        success: false,
        error: {
            message: error.message || 'Si è verificato un errore',
            code: error.code || 'UNKNOWN_ERROR',
            statusCode: error.statusCode || 500,
            stack: SERVER_CONFIG.isDevelopment ? error.stack : undefined
        }
    };
}

export function sanitizeErrorForResponse(error) {
    const formatted = formatError(error);
    
    // In produzione rimuovi informazioni sensibili
    if (SERVER_CONFIG.isProduction) {
        delete formatted.error.stack;
        delete formatted.error.detail;
        delete formatted.error.hint;
        delete formatted.error.internalQuery;
    }

    return formatted;
}