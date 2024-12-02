import { jest } from '@jest/globals';
import { errorHandler, notFoundHandler, unhandledRejectionHandler } from '../../src/utils/errors/errorHandler.js';
import AppError from '../../src/utils/errors/AppError.js';
import ValidationError from '../../src/utils/errors/ValidationError.js';
import { errorReporter } from '../../src/utils/errorReporting/errorReporter.js';
import logger from '../../src/utils/logger.js';
import { SERVER_CONFIG } from '../../src/config/environments.js';

const mockRequest = (overrides = {}) => ({
    path: '/test',
    method: 'GET',
    query: {},
    body: {},
    user: { id: 1 },
    ...overrides
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe('Error Handler Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(logger, 'error').mockImplementation(() => {});
        jest.spyOn(errorReporter, 'report').mockImplementation(() => Promise.resolve());
    });

    describe('Development Mode', () => {
        let originalEnv;
        let originalIsDev;

        beforeEach(() => {
            originalEnv = SERVER_CONFIG.nodeEnv;
            originalIsDev = SERVER_CONFIG.isDevelopment;
            SERVER_CONFIG.nodeEnv = 'development';
            SERVER_CONFIG.isDevelopment = true;
        });

        afterEach(() => {
            SERVER_CONFIG.nodeEnv = originalEnv;
            SERVER_CONFIG.isDevelopment = originalIsDev;
        });

        test('should handle AppError with full details', async () => {
            const error = new AppError('Test error', 400, 'TEST_ERROR');
            const req = mockRequest();
            const res = mockResponse();
            
            await errorHandler(error, req, res, mockNext);
            
            expect(res.status).toHaveBeenCalledWith(400);
            const expectedError = {
                success: false,
                error: expect.objectContaining({
                    message: 'Test error',
                    code: 'TEST_ERROR',
                    statusCode: 400,
                    stack: expect.any(String)
                })
            };
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining(expectedError));
        });

        test('should handle ValidationError', () => {
            const errors = [{ field: 'email', message: 'Invalid email' }];
            const error = new ValidationError('Validation failed', errors);
            const result = error.toJSON();
            expect(result.error.errors).toEqual(errors);
        });

        test('should handle unexpected errors with stack trace', async () => {
            const error = new Error('Unexpected error');
            const req = mockRequest();
            const res = mockResponse();
            
            await errorHandler(error, req, res, mockNext);
            
            expect(res.status).toHaveBeenCalledWith(500);
            const expectedResponse = {
                success: false,
                error: expect.objectContaining({
                    message: 'Unexpected error',
                    stack: expect.any(String)
                })
            };
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining(expectedResponse));
        });
    });

    describe('Production Mode', () => {
        let originalEnv;
        let originalIsProd;

        beforeEach(() => {
            originalEnv = SERVER_CONFIG.nodeEnv;
            originalIsProd = SERVER_CONFIG.isProduction;
            SERVER_CONFIG.nodeEnv = 'production';
            SERVER_CONFIG.isProduction = true;
        });

        afterEach(() => {
            SERVER_CONFIG.nodeEnv = originalEnv;
            SERVER_CONFIG.isProduction = originalIsProd;
        });

        test('should handle operational errors without stack trace', async () => {
            const error = new AppError('Operational error');
            const req = mockRequest();
            const res = mockResponse();
            
            await errorHandler(error, req, res, mockNext);
            
            const response = res.json.mock.calls[0][0];
            expect(response.error.stack).toBeUndefined();
        });

        test('should sanitize unexpected errors', async () => {
            const error = new Error('System error');
            const req = mockRequest();
            const res = mockResponse();
            
            await errorHandler(error, req, res, mockNext);
            
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: 'Si è verificato un errore interno',
                    code: 'INTERNAL_ERROR'
                }
            });
        });

        test('should report non-operational errors', async () => {
            const error = new Error('Critical error');
            const req = mockRequest();
            const res = mockResponse();
            
            await errorHandler(error, req, res, mockNext);
            
            expect(errorReporter.report).toHaveBeenCalled();
            expect(errorReporter.report).toHaveBeenCalledWith(
                error,
                expect.objectContaining({
                    request: expect.any(Object)
                })
            );
        });
    });

    describe('Not Found Handler', () => {
        test('should create not found error', () => {
            const req = mockRequest({ originalUrl: '/not-found' });
            
            notFoundHandler(req, null, (err) => {
                expect(err).toBeInstanceOf(AppError);
                expect(err.statusCode).toBe(404);
                expect(err.message).toContain('/not-found');
            });
        });
    });

    describe('Unhandled Rejection Handler', () => {
        let spyLoggerError;
        let spyProcessExit;
        let spyReporter;
    
        beforeEach(() => {
            // Mock logger.error, process.exit, e errorReporter.report
            spyLoggerError = jest.spyOn(logger, 'error').mockImplementation(() => {});
            spyProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
            spyReporter = jest.spyOn(errorReporter, 'report').mockImplementation(() => Promise.resolve());
        });
    
        afterEach(() => {
            // Ripristina i mock
            spyLoggerError.mockRestore();
            spyProcessExit.mockRestore();
            spyReporter.mockRestore();
        });
    
        test('should log error and exit in development', () => {
            //console.log('DEBUG: Starting development mode test for unhandledRejectionHandler');
            const originalNodeEnv = SERVER_CONFIG.nodeEnv;
            const originalIsDev = SERVER_CONFIG.isDevelopment;
    
            SERVER_CONFIG.nodeEnv = 'development';
            SERVER_CONFIG.isDevelopment = true;
    
            const error = new Error('Test Error');
            const promise = Promise.resolve();
    
            // Chiamata al middleware
            unhandledRejectionHandler(error, promise);
    
            //console.log('DEBUG: Checking calls to logger.error and process.exit');
            expect(spyLoggerError).toHaveBeenCalledWith('Unhandled Rejection:', { reason: error, promise });
            expect(spyProcessExit).toHaveBeenCalledWith(1);
    
            // Ripristina l'ambiente
            SERVER_CONFIG.nodeEnv = originalNodeEnv;
            SERVER_CONFIG.isDevelopment = originalIsDev;
        });
    
        test('should log error and report in production', () => {
            //console.log('DEBUG: Starting production mode test for unhandledRejectionHandler');
            const originalNodeEnv = SERVER_CONFIG.nodeEnv;
            const originalIsProd = SERVER_CONFIG.isProduction;
    
            SERVER_CONFIG.nodeEnv = 'production';
            SERVER_CONFIG.isProduction = true;
    
            const error = new Error('Test Error');
            const promise = Promise.resolve();
    
            // Chiamata al middleware
            unhandledRejectionHandler(error, promise);
    
            //console.log('DEBUG: Checking calls to logger.error and errorReporter.report');
            expect(spyLoggerError).toHaveBeenCalledWith('Unhandled Rejection:', { reason: error, promise });
            expect(spyReporter).toHaveBeenCalledWith(error);
    
            // Ripristina l'ambiente
            SERVER_CONFIG.nodeEnv = originalNodeEnv;
            SERVER_CONFIG.isProduction = originalIsProd;
        });
    });
    afterAll(() => {
        SERVER_CONFIG.nodeEnv = 'test';
        SERVER_CONFIG.isDevelopment = false;
        SERVER_CONFIG.isProduction = false;
    });
});