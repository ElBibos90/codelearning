import logger from '../logger.js';

export  class ErrorReporter {
    constructor() {
        this.shouldReport = process.env.NODE_ENV === 'production';
        this.batchSize = 10;
        this.batchTimeout = 5000;
        this.errorQueue = [];
        this.timeoutId = null;
    }

    async report(error, context = {}) {
        try {
            // Log locale sempre
            logger.error('Error Report:', {
                error: {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    code: error.code
                },
                context
            });

            if (!this.shouldReport) {
                return;
            }

            const errorReport = {
                timestamp: new Date(),
                error: {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    code: error.code
                },
                context: {
                    ...context,
                    env: process.env.NODE_ENV,
                    version: process.env.APP_VERSION
                }
            };

            this.errorQueue.push(errorReport);

            if (this.errorQueue.length >= this.batchSize) {
                await this.flushErrors();
            } else if (!this.timeoutId) {
                this.timeoutId = setTimeout(() => this.flushErrors(), this.batchTimeout);
            }
        } catch (reportError) {
            logger.error('Error in ErrorReporter:', reportError);
        }
    }

    async flushErrors() {
        if (this.errorQueue.length === 0) {
            return;
        }

        const errors = [...this.errorQueue];
        this.errorQueue = [];
        clearTimeout(this.timeoutId);
        this.timeoutId = null;

        try {
            await this.persistErrors(errors);
        } catch (error) {
            logger.error('Error flushing errors:', error);
            // Reinserisce gli errori in coda
            this.errorQueue.push(...errors);
        }
    }

    async persistErrors() {
        try {
            // Simula l'invio degli errori
            if (this.errorQueue.length > 0) {
                console.log('Persisting errors:', this.errorQueue);
                this.errorQueue = []; // Resetta la coda dopo l'invio
            }
        } catch (e) {
            logger.error('Failed to persist errors, retrying...');
            setTimeout(() => this.persistErrors(), this.batchTimeout); // Retry
        }
    }
}

export const errorReporter = new ErrorReporter();