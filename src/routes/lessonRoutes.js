import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { lessonValidation } from '../middleware/validators.js';
import { sanitizeContent } from '../utils/sanitize.js';
import { pool } from '../config/database.js';
import { SERVER_CONFIG } from '../config/environments.js';


const router = express.Router();

router.get('/:id/detail', authenticateToken, async (req, res) => {
    try {
        const lessonId = parseInt(req.params.id);

        const lessonCheck = await pool.query(`
            SELECT l.*, c.id as course_id
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.id = $1
        `, [lessonId]);

        if (lessonCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lezione non trovata'
            });
        }

        const lesson = lessonCheck.rows[0];

        // Verifica iscrizione al corso
        const enrollmentCheck = await pool.query(
            `SELECT id FROM course_enrollments 
             WHERE user_id = $1 AND course_id = $2`,
            [req.user.id, lesson.course_id]
        );

        if (enrollmentCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Devi essere iscritto al corso per vedere questa lezione'
            });
        }

        // Aggiorna last_accessed
        await pool.query(`
            INSERT INTO lesson_progress (user_id, lesson_id, last_accessed)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, lesson_id)
            DO UPDATE SET last_accessed = CURRENT_TIMESTAMP
        `, [req.user.id, lessonId]);

        res.json({
            success: true,
            data: lesson
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error in lesson detail route:', {
                error: error.message,
                stack: error.stack
            });
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero della lezione',
            error: error.message
        });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { 
            courseId, 
            title, 
            content, 
            orderNumber,
            templateType = 'theory',
            estimatedMinutes = 30,
            metaDescription = '',
            contentFormat = 'markdown',
            status = 'draft'
        } = req.body;
        
        // Verifica che il corso esista
        const courseCheck = await pool.query(
            'SELECT id FROM courses WHERE id = $1',
            [courseId]
        );

        if (courseCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Corso non trovato'
            });
        }

        // Sanitizza il contenuto
        const sanitizedContent = sanitizeContent(content || '');
        
        const result = await pool.query(
            `INSERT INTO lessons (
                course_id, 
                title, 
                content, 
                order_number,
                content_format,
                meta_description,
                estimated_minutes,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                courseId,
                title,
                sanitizedContent,
                orderNumber,
                contentFormat,
                metaDescription,
                estimatedMinutes,
                status
            ]
        );
        
        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error creating lesson:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nella creazione della lezione',
            error: error.message
        });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const lessonId = parseInt(req.params.id);
        const { 
            title,
            content,
            orderNumber,
            contentFormat,
            metaDescription,
            estimatedMinutes,
            status 
        } = req.body;

        // Sanitizza il contenuto se fornito
        const sanitizedContent = content ? sanitizeContent(content) : undefined;

        let updateQuery = 'UPDATE lessons SET ';
        const values = [];
        let paramCount = 1;
        const updates = [];

        if (title !== undefined) {
            updates.push(`title = $${paramCount}`);
            values.push(title);
            paramCount++;
        }

        if (sanitizedContent !== undefined) {
            updates.push(`content = $${paramCount}`);
            values.push(sanitizedContent);
            paramCount++;
        }

        if (orderNumber !== undefined) {
            updates.push(`order_number = $${paramCount}`);
            values.push(orderNumber);
            paramCount++;
        }

        if (contentFormat !== undefined) {
            updates.push(`content_format = $${paramCount}`);
            values.push(contentFormat);
            paramCount++;
        }

        if (metaDescription !== undefined) {
            updates.push(`meta_description = $${paramCount}`);
            values.push(metaDescription);
            paramCount++;
        }

        if (estimatedMinutes !== undefined) {
            updates.push(`estimated_minutes = $${paramCount}`);
            values.push(estimatedMinutes);
            paramCount++;
        }

        if (status !== undefined) {
            updates.push(`status = $${paramCount}`);
            values.push(status);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nessun campo da aggiornare fornito'
            });
        }

        values.push(lessonId);
        updateQuery += updates.join(', ') + `, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lezione non trovata'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error updating lesson:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento della lezione'
        });
    }
});

router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        const lessonId = parseInt(req.params.id);
        const { status } = req.body;

        // Validazione dello stato
        const validStatuses = ['draft', 'review', 'published', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Stato non valido'
            });
        }

        const result = await pool.query(`
            UPDATE lessons 
            SET 
                status = $1::lesson_status,
                last_edited_by = $2,
                last_edited_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, status, last_edited_at
        `, [status, req.user.id, lessonId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lezione non trovata'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error updating lesson status:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel cambio di stato della lezione'
        });
    }
});

router.put('/:id/complete', authenticateToken, async (req, res) => {
    try {
        const lessonId = parseInt(req.params.id);
        const userId = req.user.id;

        // Verifica che la lezione esista e l'utente sia iscritto al corso
        const lessonCheck = await pool.query(`
            SELECT l.id, c.id as course_id
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.id = $1
        `, [lessonId]);

        if (lessonCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lezione non trovata'
            });
        }

        const courseId = lessonCheck.rows[0].course_id;

        const enrollmentCheck = await pool.query(
            'SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
            [userId, courseId]
        );

        if (enrollmentCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Non sei iscritto a questo corso'
            });
        }

        // Aggiorna o crea il record di progresso
        await pool.query(`
            INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at)
            VALUES ($1, $2, true, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, lesson_id)
            DO UPDATE SET 
                completed = true,
                completed_at = CURRENT_TIMESTAMP
        `, [userId, lessonId]);

        res.json({
            success: true,
            message: 'Lezione completata con successo'
        });

    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error completing lesson:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel completamento della lezione'
        });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const lessonId = parseInt(req.params.id);

        const result = await pool.query(
            'DELETE FROM lessons WHERE id = $1 RETURNING id',
            [lessonId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lezione non trovata'
            });
        }

        res.json({
            success: true,
            message: 'Lezione eliminata con successo'
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error deleting lesson:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nell\'eliminazione della lezione'
        });
    }
});

export default router;