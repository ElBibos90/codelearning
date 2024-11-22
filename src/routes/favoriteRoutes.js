import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { favoriteModel } from '../models/favoriteModel.js';

const router = express.Router();

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Recupera i corsi preferiti dell'utente
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const favorites = await favoriteModel.getUserFavorites(req.user.id);
        res.json({
            success: true,
            data: favorites
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dei preferiti'
        });
    }
});

/**
 * @swagger
 * /api/favorites/{courseId}:
 *   post:
 *     summary: Aggiunge un corso ai preferiti
 *     security:
 *       - bearerAuth: []
 */
router.post('/:courseId', authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { notes } = req.body;
        const userId = req.user.id;
        
        const favorite = await favoriteModel.addFavorite(userId, courseId, notes);
        res.status(201).json({
            success: true,
            data: favorite
        });
    } catch (error) {
        if (error.message === 'Corso già nei preferiti') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiunta ai preferiti'
        });
    }
});

/**
 * @swagger
 * /api/favorites/{courseId}:
 *   delete:
 *     summary: Rimuove un corso dai preferiti
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:courseId', authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        await favoriteModel.removeFavorite(req.user.id, courseId);
        res.json({
            success: true,
            message: 'Preferito rimosso con successo'
        });
    } catch (error) {
        if (error.message === 'Preferito non trovato') {
            res.status(404).json({
                success: false,
                message: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Errore nella rimozione dai preferiti'
            });
        }
    }
});

export default router;