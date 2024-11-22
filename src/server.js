// src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
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

// Configurazione dotenv - carica il file .env appropriato
if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: '.env.test' });
} else {
    dotenv.config();
}

// Inizializzazione express
const app = express();

// Configurazione rate limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: `Troppe richieste da questo IP, riprova tra ${process.env.RATE_LIMIT_WINDOW || 15} minuti`
    }
});

// Rate limiting per autenticazione
const authLimiter = rateLimit({
    windowMs: (process.env.AUTH_RATE_LIMIT_WINDOW || 60) * 60 * 1000,
    max: process.env.AUTH_RATE_LIMIT_MAX || 5,
    message: {
        success: false,
        message: 'Troppi tentativi di accesso, riprova più tardi'
    }
});

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

// Middleware
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

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Non applicare rate limiting in ambiente di test
if (process.env.NODE_ENV !== 'test') {
    app.use(limiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
}

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

// Error handling
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Errore:`, {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        ip: req.ip,
        user: req.user?.id
    });

    res.status(err.status || 500).json({ 
        success: false, 
        message: process.env.NODE_ENV === 'development' ? err.message : 'Si è verificato un errore!',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Risorsa non trovata'
    });
});

// Server startup - solo se non in test
let server;
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    server = app.listen(PORT, () => {
        console.log(`Server in esecuzione sulla porta ${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
        console.log('Avvio shutdown graceful...');
        server.close(() => {
            console.log('Server chiuso.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}

// Un solo export alla fine del file
export default app;