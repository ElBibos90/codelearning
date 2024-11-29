import { errorReporter } from '../../src/utils/errorReporting/errorReporter.js';
import logger from '../../src/utils/logger.js';

jest.mock('../../src/utils/logger.js', () => ({
    error: jest.fn(),
    info: jest.fn()
}));

describe('Error Reporter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        errorReporter.errorQueue = [];
        if (errorReporter.timeoutId) {
            clearTimeout(errorReporter.timeoutId);
            errorReporter.timeoutId = null;
        }
    });

    test('should log error locally', async () => {
        const error = new Error('Test error');
        const context = { user: 1 };
        
        await errorReporter.report(error, context);
        
        expect(logger.error).toHaveBeenCalledWith(
            'Error Report:',
            expect.objectContaining({
                error: expect.objectContaining({
                    message: 'Test error'
                }),
                context
            })
        );
    });

    test('should batch errors up to limit', async () => {
        process.env.NODE_ENV = 'production';
        errorReporter.batchSize = 2;

        await errorReporter.report(new Error('Error 1'));
        expect(errorReporter.errorQueue.length).toBe(1);
        
        await errorReporter.report(new Error('Error 2'));
        expect(errorReporter.errorQueue.length).toBe(0); // Auto-flush at batch size
        
        process.env.NODE_ENV = 'test';
    });

    test('should flush errors after timeout', async () => {
        process.env.NODE_ENV = 'production';
        errorReporter.batchTimeout = 100;

        await errorReporter.report(new Error('Test error'));
        expect(errorReporter.errorQueue.length).toBe(1);
        
        await new Promise(resolve => setTimeout(resolve, 150));
        expect(errorReporter.errorQueue.length).toBe(0);
        
        process.env.NODE_ENV = 'test';
    });

    test('should include error context', async () => {
        const error = new Error('Contextual error');
        const context = {
            user: 1,
            action: 'test',
            data: { key: 'value' }
        };
        
        await errorReporter.report(error, context);
        
        expect(logger.error).toHaveBeenCalledWith(
            'Error Report:',
            expect.objectContaining({
                context: expect.objectContaining(context)
            })
        );
    });

    test('should handle error during reporting', async () => {
        const reportError = new Error('Report failed');
        logger.error.mockImplementationOnce(() => {
            throw reportError;
        });
        
        await errorReporter.report(new Error('Test error'));
        
        expect(logger.error).toHaveBeenCalledWith(
            'Error in ErrorReporter:',
            reportError
        );
    });

    test('should retry failed flushes', async () => {
        process.env.NODE_ENV = 'production';
        const error = new Error('Test error');
        
        // Simulate first flush failure
        jest.spyOn(errorReporter, 'persistErrors')
            .mockImplementationOnce(() => Promise.reject(new Error('Persist failed')))
            .mockImplementationOnce(() => Promise.resolve());

        await errorReporter.report(error);
        expect(errorReporter.errorQueue.length).toBe(1);
        
        // Second attempt should succeed
        await errorReporter.flushErrors();
        expect(errorReporter.errorQueue.length).toBe(0);
        
        process.env.NODE_ENV = 'test';
    });

    afterAll(() => {
        errorReporter.errorQueue = [];
        if (errorReporter.timeoutId) {
            clearTimeout(errorReporter.timeoutId);
            errorReporter.timeoutId = null;
        }
    });
});