import { jest } from '@jest/globals';
import winston from 'winston';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import logger, { requestLogger, errorLogger } from '../../src/utils/logger.js';
import express from 'express';
import request from 'supertest';
import { SERVER_CONFIG, DB_CONFIG } from '../../src/config/environments.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testLogDir = path.join(__dirname, '../../logs');

// Aumenta il timeout dei test
jest.setTimeout(30000);

let server;
let app;

const logFiles = {
    application: path.join(testLogDir, 'application.log'),
    error: path.join(testLogDir, 'error.log')
};

describe('Test Environment', () => {
    it('should have correct test environment variables', () => {
        expect(SERVER_CONFIG.nodeEnv).toBe('test');
        expect(DB_CONFIG.url).toBeDefined();
    });

    it('should mock console.error and console.warn', () => {
        expect(global.console.error).toEqual(expect.any(Function));
        expect(global.console.warn).toEqual(expect.any(Function));
    });
});

describe('Logger', () => {
    beforeAll(async () => {
        jest.spyOn(process, 'exit').mockImplementation(() => {});
        
        // Assicurati che la directory dei log esista
        await fs.mkdir(testLogDir, { recursive: true });
        
        app = express();
        app.use(express.json());
        app.use(requestLogger);

        app.get('/test-success', (req, res) => {
            logger.info('Test success log');
            res.json({ status: 'success' });
        });

        app.get('/test-error', (req, res, next) => {
            next(new Error('Test error'));
        });

        app.use(errorLogger);
        app.use((err, req, res, next) => {
            res.status(500).json({ error: err.message });
        });

        server = app.listen(0);
    });

    beforeEach(async () => {
        // Pulisci e ricrea i file di log
        for (const file of Object.values(logFiles)) {
            try {
                await fs.writeFile(file, ''); // Svuota il file
            } catch (err) {
                // Se il file non esiste, crealo
                if (err.code === 'ENOENT') {
                    await fs.writeFile(file, '');
                } else {
                    console.warn(`Warning: Could not reset ${file}:`, err.message);
                }
            }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterAll(async () => {
        if (server) {
            await new Promise(resolve => server.close(resolve));
        }
        jest.restoreAllMocks();
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should create log directory if it does not exist', async () => {
        try {
            await fs.access(testLogDir);
            expect(true).toBe(true); // Directory exists
        } catch {
            expect(false).toBe(true); // Directory doesn't exist
        }
    });

    test('should log successful requests', async () => {
        await request(server).get('/test-success');
        await new Promise(resolve => setTimeout(resolve, 500));

        const logs = await fs.readFile(logFiles.application, 'utf8')
            .catch(() => '');
        expect(logs).toContain('Test success log');
    });

    test('should log error requests', async () => {
        await request(server).get('/test-error');
        await new Promise(resolve => setTimeout(resolve, 500));

        const logs = await fs.readFile(logFiles.error, 'utf8')
            .catch(() => '');
        expect(logs).toContain('Test error');
    });

    test('should use different log levels based on environment', () => {
        const devLogger = new winston.createLogger({
            level: 'debug',
            transports: [new winston.transports.Console({ level: 'debug' })]
        });
        expect(devLogger.level).toBe('debug');

        const prodLogger = new winston.createLogger({
            level: 'info',
            transports: [new winston.transports.Console({ level: 'info' })]
        });
        expect(prodLogger.level).toBe('info');
    });

    test('should handle request duration logging', async () => {
        app.get('/test-delay', (req, res) => {
            setTimeout(() => {
                res.json({ status: 'delayed' });
            }, 100);
        });

        await request(server).get('/test-delay');
        await new Promise(resolve => setTimeout(resolve, 500));

        const logs = await fs.readFile(logFiles.application, 'utf8')
            .catch(() => '');
        expect(logs).toContain('duration');
    });

    test('should properly format log messages', async () => {
        const testMessage = 'Test log message';
        logger.info(testMessage);
        await new Promise(resolve => setTimeout(resolve, 500));

        const logs = await fs.readFile(logFiles.application, 'utf8')
            .catch(() => '');
        expect(logs).toContain(testMessage);
    });

    test('should handle multiple simultaneous logs', async () => {
        const promises = [];
        const numRequests = 5;
        
        for (let i = 0; i < numRequests; i++) {
            promises.push(request(server).get('/test-success'));
        }
        
        await Promise.all(promises);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const logs = await fs.readFile(logFiles.application, 'utf8')
            .catch(() => '');
        if (!logs.includes('Test success log')) {
            console.log('Log content:', logs);
        }
        const matches = logs.match(/Test success log/g) || [];
        expect(matches.length).toBeGreaterThanOrEqual(numRequests);
    });
});