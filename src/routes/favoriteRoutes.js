import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { favoriteModel } from '../models/favoriteModel.js';
import { SERVER_CONFIG } from '../config/environments.js';


const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const favorites = await favoriteModel.getUserFavorites(req.user.id);
        res.json({
            success: true,
            data: favorites
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error fetching favorites:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dei preferiti'
        });
    }
});

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
        if (!SERVER_CONFIG.isTest) {
            console.error('Error adding favorite:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiunta ai preferiti'
        });
    }
});

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
            if (!SERVER_CONFIG.isTest) {
                console.error('Error removing favorite:', error);
            }
            res.status(500).json({
                success: false,
                message: 'Errore nella rimozione dai preferiti'
            });
        }
    }
});

router.get('/check/:courseId', authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        const isFavorite = await favoriteModel.isFavorite(req.user.id, courseId);
        res.json({
            success: true,
            data: { isFavorite }
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error checking favorite status:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel controllo dello stato preferito'
        });
    }
});

export default router;