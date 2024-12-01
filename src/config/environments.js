// src/config/environments.js
// Aggiorna il file esistente
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvConfig() {
    const env = process.env.NODE_ENV || 'development';
    const envPath = path.resolve(__dirname, `../../.env${env === 'test' ? '.test' : ''}`);
    dotenv.config({ path: envPath });
}

loadEnvConfig();

// Configurazione server
export const SERVER_CONFIG = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    version: process.env.npm_package_version
};

// Configurazione database
export const DB_CONFIG = {
    url: process.env.DATABASE_URL,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    test: {
        database: 'codelearning_test',
        user: 'postgres',
        password: 'postgres',
        host: 'localhost',
        port: 5432
    }
};

// Configurazione Redis
export const REDIS_CONFIG = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || '',
    caching: {
        defaultTTL: 300, // 5 minuti
        longTTL: 3600,  // 1 ora
        shortTTL: 60    // 1 minuto
    }
};

// Configurazione JWT
export const JWT_CONFIG = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '24h',
    refreshTokenExpire: '7d',
    issuer: 'codelearning',
    audience: 'codelearning-users'
};

// Configurazione sicurezza e rate limiting
export const SECURITY_CONFIG = {
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authRateLimitWindow: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '60', 10),
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),
    adminRateLimitWindow: parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW || '15', 10),
    adminRateLimitMax: parseInt(process.env.ADMIN_RATE_LIMIT_MAX || '30', 10),
    passwordMinLength: 8,
    passwordRequirements: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
    bcryptSaltRounds: 10,
    tokenBlacklistDuration: 24 * 60 * 60 // 24 ore in secondi
};

// Configurazione backup
export const BACKUP_CONFIG = {
    postgresqlBin: process.env.POSTGRESQL_BIN || 'C:\\Program Files\\PostgreSQL\\17\\bin',
    backupDir: process.env.BACKUP_DIR || './backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10),
    cronSchedule: '0 3 * * *', // Ogni giorno alle 3 AM
    maxBackupSize: 1024 * 1024 * 100, // 100MB
    compressionLevel: 9
};

// Configurazione logging
export const LOGGING_CONFIG = {
    level: SERVER_CONFIG.isDevelopment ? 'debug' : 'info',
    maxFiles: '14d',
    maxSize: '20m',
    dirname: 'logs',
    errorLogName: 'error-%DATE%.log',
    combinedLogName: 'combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD'
};

// Configurazione CORS
export const CORS_CONFIG = {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 600
};

// Configurazione compressione
export const COMPRESSION_CONFIG = {
    production: {
        filter: (req, res) => !req.headers['x-no-compression'],
        threshold: 1024,
        level: 9,
        memLevel: 9
    },
    development: {
        filter: (req, res) => !req.headers['x-no-compression'],
        threshold: 0,
        level: 6,
        memLevel: 8
    }
};

// Configurazione monitoring
export const MONITORING_CONFIG = {
    metricsPath: '/api/monitoring/metrics',
    defaultLabels: {
        app: 'codelearning',
        version: SERVER_CONFIG.version
    },
    collectDefaultMetrics: true,
    prometheusTimeout: 10000
};

export default {
    SERVER_CONFIG,
    DB_CONFIG,
    REDIS_CONFIG,
    JWT_CONFIG, 
    SECURITY_CONFIG,
    BACKUP_CONFIG,
    LOGGING_CONFIG,
    CORS_CONFIG,
    COMPRESSION_CONFIG,
    MONITORING_CONFIG
};