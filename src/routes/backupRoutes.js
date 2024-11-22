import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import backupService from '../services/backupService.js';

const router = express.Router();

// Inizia un backup manuale
router.post('/create', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await backupService.performBackup();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Errore durante la creazione del backup',
            error: error.message
        });
    }
});

// Lista tutti i backup disponibili
router.get('/list', authenticateToken, isAdmin, async (req, res) => {
    try {
        const backups = await backupService.listBackups();
        res.json({
            success: true,
            data: backups
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Errore durante il recupero dei backup',
            error: error.message
        });
    }
});

// Ripristina un backup specifico
router.post('/restore/:fileName', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await backupService.restoreBackup(req.params.fileName);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Errore durante il ripristino del backup',
            error: error.message
        });
    }
});

export default router;