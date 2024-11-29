import { errorHandler, notFoundHandler, unhandledRejectionHandler, uncaughtExceptionHandler } from '../../src/utils/errors/errorHandler.js';
import AppError from '../../src/utils/errors/AppError.js';
import ValidationError from '../../src/utils/errors/ValidationError.js';
import AuthError from '../../src/utils/errors/AuthError.js';
import { errorReporter } from '../../src/utils/errorReporting/errorReporter.js';
import logger from '../../src/utils/logger.js';

// Mock di express Request/Response
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
        beforeAll(() => {
            process.env.NODE_ENV = 'development';
        });

        test('should handle AppError with full details', async () => {
            const error = new AppError('Test error', 400, 'TEST_ERROR');
            const req = mockRequest();
            const res = mockResponse();
            
            await errorHandler(error, req, res, mockNext);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    message: 'Test error',
                    code: 'TEST_ERROR',
                    stack: expect.any(String)
                })
            }));
        });

        test('should handle ValidationError', async () => {
            const error = ValidationError.fromExpressValidator({
                array: () => [{
                    path: 'email',
                    msg: 'Invalid email'
                }]
            });
            const req = mockRequest();
            const res = mockResponse();
            
            await errorHandler(error, req, res, mockNext);
            
            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    code: 'VALIDATION_ERROR',
                    errors: expect.any(Array)
                })
            }));
        });

        test('should handle unexpected errors with stack trace', async () => {
            const error = new Error('Unexpected error');
            const req = mockRequest();
            const res = mockResponse();
            
            await errorHandler(error, req, res, mockNext);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    stack: expect.any(String)
                })
            }));
            expect(errorReporter.report).toHaveBeenCalled();
        });
    });

    describe('Production Mode', () => {
        beforeAll(() => {
            process.env.NODE_ENV = 'production';
        });

        test('should handle operational errors without stack trace', async () => {
            const error = new AppError('Operational error');
            const req = mockRequest();
            const res = mockResponse();
            
            await errorHandler(error, req, res, mockNext);
            
            expect(res.json.mock.calls[0][0].error.stack).toBeUndefined();
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
        const originalExit = process.exit;
        
        beforeAll(() => {
            process.exit = jest.fn();
        });
        
        afterAll(() => {
            process.exit = originalExit;
        });

        test('should handle unhandled rejections', () => {
            const error = new Error('Unhandled rejection');
            unhandledRejectionHandler(error, Promise.resolve());
            
            if (process.env.NODE_ENV === 'development') {
                expect(process.exit).toHaveBeenCalledWith(1);
            } else {
                expect(errorReporter.report).toHaveBeenCalledWith(error);
            }
        });
    });

    afterAll(() => {
        process.env.NODE_ENV = 'test';
    });
});