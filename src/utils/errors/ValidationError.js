import AppError from './AppError.js';
import { SERVER_CONFIG } from '../../config/environments.js';

class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message);
        this.statusCode = 422;
        this.code = 'VALIDATION_ERROR';
        this.errors = errors;
        this.name = 'ValidationError';
    }

    toJSON() {
        return {
            success: false,
            error: {
                message: this.message,
                code: this.code,
                statusCode: this.statusCode,
                errors: this.errors,
                ...(SERVER_CONFIG.isDevelopment && { stack: this.stack })
            }
        };
    }

    static fromExpressValidator(validationErrors) {
        const errors = Array.isArray(validationErrors) 
            ? validationErrors 
            : validationErrors.array ? validationErrors.array() : [validationErrors];
    
        const formattedErrors = errors.map(err => ({
            field: err.param || err.field || err.path || 'unknown',
            message: err.msg || err.message || 'Validation error',
            value: err.value || null
        }));
    
        return new ValidationError('Validation Error', formattedErrors);
    }

    static fromJoi(joiError) {
        const errors = joiError.details.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.context.value
        }));

        return new ValidationError('Errore di validazione', errors);
    }

    static fromZod(zodError) {
        const errors = zodError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.input
        }));

        return new ValidationError('Errore di validazione', errors);
    }

    addError(field, message, value = undefined) {
        this.errors.push({ field, message, value });
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    getFieldErrors(field) {
        return this.errors.filter(error => error.field === field);
    }
}

export default ValidationError;