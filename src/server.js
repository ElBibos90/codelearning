// src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import compression from 'compression';
import logger, { requestLogger, errorLogger } from './utils/logger.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import backupService from './services/backupService.js';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';
import adminRoutes from './routes/adminRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import { securityMiddleware } from './middleware/security.js';
import { errorHandler, notFoundHandler, unhandledRejectionHandler, uncaughtExceptionHandler } from './utils/errors/errorHandler.js';

// Gestione uncaught exceptions e unhandled rejections
process.on('uncaughtException', uncaughtExceptionHandler);
process.on('unhandledRejection', unhandledRejectionHandler);

// Configurazione dotenv - carica il file .env appropriato
if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: '.env.test' });
} else {
    dotenv.config();
}

// Configurazione compressione
const shouldCompress = (req, res) => {
    if (req.headers['x-no-compression']) {
        return false;
    }
    return compression.filter(req, res);
};

// Inizializzazione express
const app = express();

// Configurazione CORS
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Non consentito per questa origine.'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 600
};

// Logging middleware
app.use(requestLogger);

// Middleware di compressione prima degli altri middleware
if (process.env.NODE_ENV === 'production') {
    app.use(compression({
      filter: shouldCompress,
      threshold: 1024,
      level: 9,
      memLevel: 9,
      strategy: 0,
      windowBits: 15
    }));
} else {
    app.use(compression({
        filter: shouldCompress,
        threshold: 0,
        level: 6,
        memLevel: 8,
        strategy: 0,
        windowBits: 15
    }));
}

// Middleware di base
app.use(cors(corsOptions));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Middleware
app.use(securityMiddleware.checkBlacklist);

// Rate Limiters per tipo di route
app.use('/api/auth/*', securityMiddleware.authLimiter);
app.use('/api/admin/*', securityMiddleware.adminLimiter);
app.use('/api/*', securityMiddleware.apiLimiter);

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'DENY');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/courses', courseRoutes); 
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoriteRoutes);

// Swagger UI solo in development e production
if (process.env.NODE_ENV !== 'test') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        swaggerOptions: {
            persistAuthorization: true
        },
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: "API Documentation"
    }));

    // Inizializza il servizio di backup
    backupService.scheduleBackups();
}

// Health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'Server funzionante!',
        timestamp: new Date(),
        environment: process.env.NODE_ENV 
    });
});

// Error logging middleware
app.use(errorLogger);

// Global error handling
app.use(errorHandler);

// 404 handler deve essere l'ultimo middleware prima dell'error handler
app.use(notFoundHandler);

// Server startup - solo se non in test
let server;
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    server = app.listen(PORT, () => {
        logger.info(`Server in esecuzione sulla porta ${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
        logger.info('Starting graceful shutdown...');
        server.close(() => {
            logger.info('Server closed.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}

export default app;