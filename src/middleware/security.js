// src/middleware/security.js
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// Rate limiting configurazione
export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 100, // limite di 100 richieste per windowMs
    message: {
        success: false,
        message: 'Troppe richieste da questo IP, riprova tra 15 minuti'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Personalizza il limite per rotte specifiche
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: `Troppe richieste. Limite: ${req.rateLimit.limit} richieste ogni ${req.rateLimit.windowMs/60000} minuti.`
        });
    }
});

// Rate limiting più stringente per autenticazione
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 ora
    max: 5, // limite di 5 tentativi per ora
    message: {
        success: false,
        message: 'Troppi tentativi di accesso, riprova tra un\'ora'
    }
});

// Configurazione CORS
export const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 600 // 10 minuti
};

// Middleware per headers di sicurezza aggiuntivi
export const securityHeaders = (req, res, next) => {
    // Previene il MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Abilita la protezione XSS in browser moderni
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Impedisce il caricamento in un iframe (clickjacking)
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Strict Transport Security
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
};