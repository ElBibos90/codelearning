// src/routes/profileRoutes.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { UserService } from '../services/index.js';
import { getCachedData, cacheData } from '../config/redis.js';
import { SERVER_CONFIG } from '../config/environments.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const cacheKey = `profile:${req.user.id}`;
        
        if (!SERVER_CONFIG.isTest) {
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return res.json({
                    success: true,
                    data: cachedData
                });
            }
        }

        const profile = await UserService.getFullProfile(req.user.id);

        if (!SERVER_CONFIG.isTest) {
            await cacheData(cacheKey, profile, 300);
        }

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Profile Error:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero del profilo',
            error: error.message
        });
    }
});

router.put('/', authenticateToken, async (req, res) => {
    try {
        const updatedProfile = await UserService.updateProfile(
            req.user.id, 
            req.body
        );

        res.json({
            success: true,
            message: 'Profilo aggiornato con successo',
            data: updatedProfile
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error updating profile:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento del profilo'
        });
    }
});

router.put('/preferences', authenticateToken, async (req, res) => {
    try {
        const {
            notification_email,
            preferred_difficulty,
            theme,
            language
        } = req.body;

        const updatedPreferences = await UserService.updatePreferences(req.user.id, {
            notification_email,
            preferred_difficulty,
            theme,
            language
        });

        res.json({
            success: true,
            message: 'Preferenze aggiornate con successo',
            data: updatedPreferences
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error updating preferences:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento delle preferenze'
        });
    }
});

router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await UserService.getUserStats(req.user.id);
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error fetching user stats:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle statistiche utente'
        });
    }
});

router.put('/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        await UserService.changePassword(
            req.user.id,
            currentPassword,
            newPassword
        );

        res.json({
            success: true,
            message: 'Password aggiornata con successo'
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error changing password:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel cambio password',
            error: error.message
        });
    }
});

export default router;