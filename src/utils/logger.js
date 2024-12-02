import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { SERVER_CONFIG } from '../config/environments.js';


// Crea la directory dei log se non esiste
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Configurazione del formato dei log
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
        // Formattazione speciale per gli errori
        if (meta.error) {
            const error = meta.error;
            return JSON.stringify({
                timestamp,
                level,
                message,
                error: {
                    name: error.name,
                    message: error.message,
                    code: error.code,
                    stack: error.stack,
                    ...error
                },
                ...meta
            }, null, 2);
        }
        
        // Formattazione standard per altri log
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
        }, null, 2);
    })
);

// Transport per file rotanti giornalieri
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logDir, `%DATE%-application.log`),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: SERVER_CONFIG.isDevelopment ? 'debug' : 'info'
});

// Transport per errori
const errorFileTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logDir, `%DATE%-error.log`),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error'
});

// Configurazione logger
const logger = winston.createLogger({
    level: SERVER_CONFIG.isDevelopment ? 'debug' : 'info',
    format: logFormat,
    defaultMeta: { service: 'codelearning' },
    transports: [
        // Usa transport diversi per test e non-test
        ...(SERVER_CONFIG.isTest ? [
            new winston.transports.File({ 
                filename: 'logs/application.log',
                level: 'info'
            }),
            new winston.transports.File({ 
                filename: 'logs/error.log',
                level: 'error'
            })
        ] : [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }),
            dailyRotateFileTransport,
            errorFileTransport
        ])
    ],
    exitOnError: false
});

// Middleware per logging delle richieste HTTP
export const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('user-agent') || '',
            ip: req.ip,
            userId: req.user?.id || 'anonymous'
        };

        if (res.statusCode >= 400) {
            logger.warn('HTTP Request', message);
        } else {
            logger.info('HTTP Request', message);
        }
    });

    next();
};

// Middleware per logging degli errori
export const errorLogger = (err, req, res, next) => {
    const errorLog = {
        error: {
            name: err.name,
            message: err.message,
            code: err.code,
            stack: err.stack,
            statusCode: err.statusCode
        },
        request: {
            method: req.method,
            path: req.path,
            headers: req.headers,
            query: req.query,
            body: req.body,
            user: req.user?.id || 'anonymous'
        },
        timestamp: new Date().toISOString()
    };

    // Log dettagliato dell'errore
    logger.error('Request Error:', errorLog);

    next(err);
};

export default logger;