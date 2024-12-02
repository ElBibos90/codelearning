import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import backupService from '../services/backupService.js';
import { BACKUP_CONFIG, SERVER_CONFIG } from '../config/environments.js';

const router = express.Router();

// Inizia un backup manuale
router.post('/create', authenticateToken, isAdmin, async (req, res) => {
    try {
        if (!SERVER_CONFIG.isProduction && !req.query.force) {
            return res.status(400).json({
                success: false,
                message: 'I backup manuali sono consentiti solo in produzione'
            });
        }

        const result = await backupService.performBackup();
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Errore durante la creazione del backup',
                error: result.error
            });
        }

        res.json({
            success: true,
            data: {
                fileName: result.fileName,
                timestamp: result.timestamp,
                backupDir: BACKUP_CONFIG.backupDir
            },
            message: 'Backup completato con successo'
        });
    } catch (error) {
        console.error('Backup creation error:', error);
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
            data: backups.map(backup => ({
                ...backup,
                path: `${BACKUP_CONFIG.backupDir}/${backup.fileName}`
            }))
        });
    } catch (error) {
        console.error('Backup list error:', error);
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
        // Impedisci il ripristino in produzione senza conferma
        if (SERVER_CONFIG.isProduction && !req.body.confirmProduction) {
            return res.status(400).json({
                success: false,
                message: 'È richiesta una conferma esplicita per il ripristino in produzione'
            });
        }

        const result = await backupService.restoreBackup(req.params.fileName);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Errore durante il ripristino del backup',
                error: result.error
            });
        }

        res.json({
            success: true,
            data: {
                ...result,
                environment: SERVER_CONFIG.nodeEnv
            },
            message: 'Backup ripristinato con successo'
        });
    } catch (error) {
        console.error('Backup restore error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante il ripristino del backup',
            error: error.message
        });
    }
});

export default router;