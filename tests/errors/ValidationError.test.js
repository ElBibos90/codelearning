import ValidationError from '../../src/utils/errors/ValidationError.js';

describe('ValidationError', () => {
    test('should create validation error with errors array', () => {
        const errors = [
            { field: 'email', message: 'Invalid email' }
        ];
        const error = new ValidationError('Validation failed', errors);
        
        expect(error.statusCode).toBe(422);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.errors).toEqual(errors);
    });

    test('should create from express-validator errors', () => {
        const expressValidatorErrors = {
            array: () => ([{
                path: 'email',
                msg: 'Invalid email',
                value: 'test'
            }])
        };
        
        const error = ValidationError.fromExpressValidator(expressValidatorErrors);
        
        expect(error.statusCode).toBe(422);
        expect(error.errors[0]).toEqual({
            field: 'email',
            message: 'Invalid email',
            value: 'test'
        });
    });

    test('should create from joi errors', () => {
        const joiError = {
            details: [{
                path: ['email'],
                message: 'Invalid email',
                context: { value: 'test' }
            }]
        };
        
        const error = ValidationError.fromJoi(joiError);
        
        expect(error.errors[0]).toEqual({
            field: 'email',
            message: 'Invalid email',
            value: 'test'
        });
    });

    test('should create from zod errors', () => {
        const zodError = {
            errors: [{
                path: ['email'],
                message: 'Invalid email',
                input: 'test'
            }]
        };
        
        const error = ValidationError.fromZod(zodError);
        
        expect(error.errors[0]).toEqual({
            field: 'email',
            message: 'Invalid email',
            value: 'test'
        });
    });

    test('should add errors dynamically', () => {
        const error = new ValidationError('Validation failed');
        error.addError('password', 'Too short');
        
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0]).toEqual({
            field: 'password',
            message: 'Too short',
            value: undefined
        });
    });

    test('should check if has errors', () => {
        const error = new ValidationError('Validation failed');
        expect(error.hasErrors()).toBe(false);
        
        error.addError('field', 'error');
        expect(error.hasErrors()).toBe(true);
    });

    test('should get errors by field', () => {
        const error = new ValidationError('Validation failed');
        error.addError('password', 'Too short');
        error.addError('password', 'No numbers');
        error.addError('email', 'Invalid');
        
        const passwordErrors = error.getFieldErrors('password');
        expect(passwordErrors).toHaveLength(2);
        expect(passwordErrors[0].message).toBe('Too short');
        expect(passwordErrors[1].message).toBe('No numbers');
    });
});