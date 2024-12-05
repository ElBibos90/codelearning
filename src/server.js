import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import { monitorRequest } from './middleware/monitoring.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

import { 
    SERVER_CONFIG, 
    CORS_CONFIG, 
    COMPRESSION_CONFIG 
} from './config/environments.js';

// Gestione uncaught exceptions e unhandled rejections
process.on('uncaughtException', uncaughtExceptionHandler);
process.on('unhandledRejection', unhandledRejectionHandler);

// Inizializzazione express
const app = express();

// Configurazione compressione
const compressionConfig = SERVER_CONFIG.isProduction 
    ? COMPRESSION_CONFIG.production 
    : COMPRESSION_CONFIG.development;

// Middleware di compressione prima degli altri middleware
app.use(compression(compressionConfig));

// Logging middleware
app.use(requestLogger);

// Aggiungi prima degli altri middleware
app.use(monitorRequest);

// Middleware di base
app.use(cors(CORS_CONFIG));
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
    if (SERVER_CONFIG.isProduction) {
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
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Swagger UI solo in development e production
if (!SERVER_CONFIG.isTest) {
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
        environment: SERVER_CONFIG.nodeEnv 
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
if (!SERVER_CONFIG.isTest) {
    const PORT = SERVER_CONFIG.port;
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