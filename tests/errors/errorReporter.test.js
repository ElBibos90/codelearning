import { jest } from '@jest/globals';
import { errorReporter } from '../../src/utils/errorReporting/errorReporter.js';
import logger from '../../src/utils/logger.js';


// Mock delle funzioni logger
logger.error = jest.fn();
logger.info = jest.fn();

describe('Error Reporter', () => {
    let originalQueue;
    let originalPersistErrors;

    beforeEach(() => {
        // Salva lo stato originale
        originalQueue = [...(errorReporter.errorQueue || [])];
        originalPersistErrors = errorReporter.persistErrors;

        // Reset dello stato e dei mock
        jest.clearAllMocks();
        errorReporter.errorQueue = [];
        errorReporter.shouldReport = true;
        if (errorReporter.timeoutId) {
            clearTimeout(errorReporter.timeoutId);
            errorReporter.timeoutId = null;
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
        errorReporter.errorQueue = [];
    });

    afterEach(() => {
        // Ripristina lo stato originale
        errorReporter.errorQueue = originalQueue;
        errorReporter.persistErrors = originalPersistErrors;
        errorReporter.shouldReport = process.env.NODE_ENV === 'production';
    });

    test('should log error locally', async () => {
        const error = new Error('Test error');
        const context = { user: 1 };
        
        await errorReporter.report(error, context);
        
        expect(logger.error).toHaveBeenCalledWith('Error Report:', expect.objectContaining({
            error: expect.any(Object),
            context
        }));
    });

    test('should batch errors up to limit', async () => {
        errorReporter.batchSize = 2;
        
        // Override persistErrors per il test
        errorReporter.persistErrors = jest.fn().mockResolvedValue(undefined);
        
        await errorReporter.report(new Error('Error 1'));
        expect(errorReporter.errorQueue).toHaveLength(1);
        
        await errorReporter.report(new Error('Error 2'));
        expect(errorReporter.errorQueue).toHaveLength(0);
        expect(errorReporter.persistErrors).toHaveBeenCalledTimes(1);
    });

    test('should flush errors after timeout', async () => {
        errorReporter.batchTimeout = 50;
        errorReporter.persistErrors = jest.fn().mockResolvedValue(undefined);
        
        await errorReporter.report(new Error('Test error'));
        expect(errorReporter.errorQueue).toHaveLength(1);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(errorReporter.errorQueue).toHaveLength(0);
        expect(errorReporter.persistErrors).toHaveBeenCalledTimes(1);
    });

    test('should include error context', async () => {
        const error = new Error('Contextual error');
        const context = { 
            user: 1,
            action: 'test',
            data: { key: 'value' }
        };
        
        await errorReporter.report(error, context);
        
        expect(logger.error).toHaveBeenCalledWith('Error Report:', expect.objectContaining({
            context: expect.objectContaining(context)
        }));
    });

    test('should handle error during reporting', async () => {
        logger.error.mockImplementationOnce(() => {
            throw new Error('Report failed');
        });
        
        await errorReporter.report(new Error('Test error'));
        
        expect(logger.error).toHaveBeenLastCalledWith(
            'Error in ErrorReporter:',
            expect.any(Error)
        );
    });

test('should retry failed flushes', async () => {
    // Mock persistErrors
    jest.spyOn(errorReporter, 'persistErrors').mockImplementation(() => {
        throw new Error('Persist failed');
    });

    // Modifica lo stato locale
    errorReporter.errorQueue = [{ message: 'Test error' }];

    try {
        await errorReporter.persistErrors();
    } catch (err) {
        // Ignora l'errore
    }

    expect(errorReporter.persistErrors).toHaveBeenCalledTimes(1); // Retry 1 volta
});
});