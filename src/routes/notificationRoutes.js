import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import NotificationService from '../services/NotificationService.js';
import { ValidationError } from '../utils/errors/index.js';
import { SERVER_CONFIG } from '../config/environments.js';

const router = express.Router();

// Get user notifications with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { 
            limit = 10, 
            offset = 0, 
            unreadOnly = false,
            type = null 
        } = req.query;

        const notifications = await NotificationService.getUserNotifications(
            req.user.id,
            {
                limit: parseInt(limit),
                offset: parseInt(offset),
                unreadOnly: unreadOnly === 'true',
                type
            }
        );

        // Get unread count for badge
        const unreadCount = await NotificationService.getUnreadCount(req.user.id);

        res.json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error fetching notifications:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle notifiche'
        });
    }
});

// Mark single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const notification = await NotificationService.markAsRead(
            parseInt(req.params.id),
            req.user.id
        );

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error marking notification as read:', error);
        }
        if (error instanceof ValidationError) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Errore durante la lettura della notifica'
            });
        }
    }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        const notifications = await NotificationService.markAllAsRead(req.user.id);

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error marking all notifications as read:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore durante la lettura delle notifiche'
        });
    }
});

// Delete single notification
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await NotificationService.delete(parseInt(req.params.id), req.user.id);

        res.json({
            success: true,
            message: 'Notifica eliminata con successo'
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error deleting notification:', error);
        }
        if (error instanceof ValidationError) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Errore durante l\'eliminazione della notifica'
            });
        }
    }
});

// Delete all read notifications
router.delete('/read/all', authenticateToken, async (req, res) => {
    try {
        const deleted = await NotificationService.deleteAllRead(req.user.id);

        res.json({
            success: true,
            message: `${deleted.length} notifiche eliminate con successo`
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error deleting read notifications:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore durante l\'eliminazione delle notifiche'
        });
    }
});

export default router;