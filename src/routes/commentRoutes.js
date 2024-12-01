import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { SERVER_CONFIG } from '../config/environments.js';


const router = express.Router();

router.get('/lesson/:lessonId', authenticateToken, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const query = `
            SELECT 
                c.id,
                c.content,
                c.created_at,
                c.updated_at,
                c.parent_id,
                u.name as user_name
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.lesson_id = $1 AND c.is_deleted = FALSE
            ORDER BY c.created_at DESC
        `;
        const { rows } = await pool.query(query, [lessonId]);
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error fetching comments:', error);
        }
        res.status(500).json({ 
            success: false,
            message: 'Errore nel recupero dei commenti'
        });
    }
});

router.post('/lesson/:lessonId', authenticateToken, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { content, parentId } = req.body;
        const userId = req.user.id;

        const query = `
            INSERT INTO comments (lesson_id, user_id, content, parent_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id, content, created_at
        `;
        const { rows } = await pool.query(query, [lessonId, userId, content, parentId || null]);
        res.status(201).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error creating comment:', error);
        }
        res.status(500).json({ 
            success: false,
            message: 'Errore nella creazione del commento'
        });
    }
});

router.put('/:commentId', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const query = `
            UPDATE comments 
            SET content = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND user_id = $3 AND is_deleted = FALSE
            RETURNING id, content, updated_at
        `;
        const { rows } = await pool.query(query, [content, commentId, userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Commento non trovato o non autorizzato'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error updating comment:', error);
        }
        res.status(500).json({ 
            success: false,
            message: 'Errore nell\'aggiornamento del commento'
        });
    }
});

router.delete('/:commentId', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const query = `
            UPDATE comments
            SET is_deleted = TRUE
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `;
        const { rows } = await pool.query(query, [commentId, userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Commento non trovato o non autorizzato'
            });
        }
        
        res.json({
            success: true,
            message: 'Commento eliminato con successo'
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error deleting comment:', error);
        }
        res.status(500).json({ 
            success: false,
            message: 'Errore nell\'eliminazione del commento'
        });
    }
});

export default router;