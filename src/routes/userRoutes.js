// src/routes/userRoutes.js
import express from 'express';
import { UserService }   from '../services/index.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { SERVER_CONFIG } from '../config/environments.js';

const router = express.Router();

router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await UserService.getAllUsers();
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error fetching users:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero degli utenti'
        });
    }
});

router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const user = await UserService.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utente non trovato'
            });
        }
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error fetching user:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dell\'utente'
        });
    }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await UserService.createUser(req.body);
        res.status(201).json({
            success: true,
            data: result.user,
            message: 'Utente creato con successo'
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error creating user:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nella creazione dell\'utente'
        });
    }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const updatedUser = await UserService.updateUser(req.params.id, req.body);
        res.json({
            success: true,
            data: updatedUser,
            message: 'Utente aggiornato con successo'
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error updating user:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento dell\'utente'
        });
    }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await UserService.deleteUser(req.params.id);
        res.json({
            success: true,
            message: 'Utente eliminato con successo'
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error deleting user:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nell\'eliminazione dell\'utente'
        });
    }
});

// Admin routes
router.get('/admin/activity', authenticateToken, isAdmin, async (req, res) => {
    try {
        const activity = await UserService.getUserActivity();
        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error fetching user activity:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle attività utenti'
        });
    }
});

router.post('/:id/role', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const updatedUser = await UserService.updateUserRole(req.params.id, role);
        res.json({
            success: true,
            data: updatedUser,
            message: 'Ruolo utente aggiornato con successo'
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error updating user role:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento del ruolo utente'
        });
    }
});

export default router;