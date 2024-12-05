// src/routes/authRoutes.js
import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { registerValidation } from '../middleware/validators.js';
import { UserService }   from '../services/index.js';

const router = express.Router();

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email e password sono richiesti'
            });
        }

        const { user, token } = await UserService.login(email, password);

        res.json({
            success: true,
            message: 'Login effettuato con successo',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        next(error);
    }
});

router.get('/profile', authenticateToken, async (req, res) => {
    res.json({
        success: true,
        message: 'Profilo utente recuperato con successo',
        user: req.user
    });
});

router.get('/admin', authenticateToken, isAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'Accesso admin consentito',
        user: req.user
    });
});

router.post('/logout', authenticateToken, async (req, res) => {
    try {
        await UserService.logout(req.user.id);
        res.json({
            success: true,
            message: 'Logout effettuato con successo'
        });
    } catch (error) {
        next(error);
    }
});

router.post('/register', registerValidation, async (req, res, next) => {
    try {
        const result = await UserService.register(req.body);
        
        res.status(201).json({
            success: true,
            data: result.user,
            token: result.token,
            message: 'Registrazione completata con successo'
        });
    } catch (error) {
        next(error);
    }
});

router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token non fornito'
            });
        }

        const result = await UserService.refreshToken(refreshToken);

        res.json({
            success: true,
            token: result.token
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Refresh token non valido o scaduto'
        });
    }
});

export default router;