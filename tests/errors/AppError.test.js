import { jest } from '@jest/globals';
import AppError from '../../src/utils/errors/AppError.js';
import { SERVER_CONFIG } from '../../src/config/environments.js';

describe('AppError', () => {
    test('should create basic error with defaults', () => {
        const error = new AppError('Test error');
        
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe('INTERNAL_ERROR');
        expect(error.isOperational).toBe(true);
    });

    test('should create error with custom properties', () => {
        const error = new AppError('Custom error', 400, 'CUSTOM_ERROR', { key: 'value' });
        
        expect(error.message).toBe('Custom error');
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('CUSTOM_ERROR');
        expect(error.data).toEqual({ key: 'value' });
    });

    test('should convert to JSON correctly', () => {
        const error = new AppError('JSON error', 400, 'JSON_ERROR');
        const json = error.toJSON();
        
        expect(json.success).toBe(false);
        expect(json.error).toBeDefined();
        expect(json.error.message).toBe('JSON error');
        expect(json.error.code).toBe('JSON_ERROR');
        expect(json.error.statusCode).toBe(400);
    });

    test('should identify operational errors', () => {
        const operationalError = new AppError('Operational');
        const nonOperationalError = new Error('Non operational');
        
        expect(AppError.isOperationalError(operationalError)).toBe(true);
        expect(AppError.isOperationalError(nonOperationalError)).toBe(false);
    });

    test('should create specific error types', () => {
        const badRequest = AppError.badRequest('Bad request');
        expect(badRequest.statusCode).toBe(400);
        
        const unauthorized = AppError.unauthorized();
        expect(unauthorized.statusCode).toBe(401);
        
        const forbidden = AppError.forbidden();
        expect(forbidden.statusCode).toBe(403);
        
        const notFound = AppError.notFound();
        expect(notFound.statusCode).toBe(404);
        
        const validation = AppError.validation();
        expect(validation.statusCode).toBe(422);
    });

    test('should include stack trace in development', () => {
               const originalEnv = SERVER_CONFIG.nodeEnv;
               const originalIsDev = SERVER_CONFIG.isDevelopment;
               SERVER_CONFIG.nodeEnv = 'development';
               SERVER_CONFIG.isDevelopment = true;
        
                const error = new AppError('Stack test');
                const json = error.toJSON();
                expect(json.error.stack).toBeDefined();
              
               SERVER_CONFIG.nodeEnv = originalEnv;
               SERVER_CONFIG.isDevelopment = originalIsDev;
            });
});