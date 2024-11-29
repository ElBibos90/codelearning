import { jest } from '@jest/globals';
import DatabaseError from '../../src/utils/errors/DatabaseError.js';

describe('DatabaseError', () => {
    test('should create basic database error', () => {
        const error = new DatabaseError('Database error');
        
        expect(error.message).toBe('Database error');
        expect(error.statusCode).toBe(500);
        expect(error.name).toBe('DatabaseError');
    });

    test('should parse PostgreSQL errors', () => {
        const pgError = {
            code: '23505',
            detail: 'Key (email)=(test@test.com) already exists.',
            table: 'users'
        };
        
        const error = DatabaseError.fromPgError(pgError);
        
        expect(error.code).toBe('UNIQUE_VIOLATION');
        expect(error.statusCode).toBe(500);
        expect(error.pgError).toBe(pgError);
    });

    test('should identify unique violation errors', () => {
        const error = DatabaseError.fromPgError({
            code: '23505'
        });
        
        expect(DatabaseError.isUniqueViolation(error)).toBe(true);
        expect(DatabaseError.isUniqueViolation(new Error())).toBe(false);
    });

    test('should identify foreign key violation errors', () => {
        const error = DatabaseError.fromPgError({
            code: '23503'
        });
        
        expect(DatabaseError.isForeignKeyViolation(error)).toBe(true);
        expect(DatabaseError.isForeignKeyViolation(new Error())).toBe(false);
    });

    test('should identify connection errors', () => {
        const error = DatabaseError.fromPgError({
            code: '08006'
        });
        
        expect(DatabaseError.isConnectionError(error)).toBe(true);
        expect(DatabaseError.isConnectionError(new Error())).toBe(false);
    });

    test('should handle JSON serialization', () => {
        process.env.NODE_ENV = 'development';
        const pgError = {
            code: '23505',
            detail: 'Key violation'
        };
        const error = DatabaseError.fromPgError(pgError);
        const json = error.toJSON();
        
        expect(json.error.pgError).toBeDefined();
        
        process.env.NODE_ENV = 'production';
        const prodJson = error.toJSON();
        expect(prodJson.error.pgError).toBeUndefined();
        
        process.env.NODE_ENV = 'test';
    });

    test('should handle missing PostgreSQL error', () => {
        const error = new DatabaseError('Generic error');
        expect(error.code).toBe('DB_ERROR');
        expect(error.message).toBe('Generic error');
    });
});