import AppError from './AppError.js';

class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 422, 'VALIDATION_ERROR', { errors });
        this.errors = errors;
        this.name = 'ValidationError';
    }

    static fromExpressValidator(validationErrors) {
        const errors = validationErrors.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value
        }));

        return new ValidationError('Errore di validazione', errors);
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

    toJSON() {
        return {
            ...super.toJSON(),
            errors: this.errors
        };
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