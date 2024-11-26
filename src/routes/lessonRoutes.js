import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { lessonValidation } from '../middleware/validators.js';
import { sanitizeContent } from '../utils/sanitize.js';
import { pool } from '../config/database.js';

const router = express.Router();

router.get('/:id/detail', authenticateToken, async (req, res) => {
    try {
        const lessonId = parseInt(req.params.id);
        // console.log('Attempting to fetch lesson:', {
        //     lessonId,
        //     userId: req.user.id
        // });

        // Prima verifica che la lezione esista e prendi il corso associato
        const lessonCheck = await pool.query(`
            SELECT l.*, c.id as course_id
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.id = $1
        `, [lessonId]);

        //console.log('Lesson check result:', lessonCheck.rows);

        if (lessonCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lezione non trovata'
            });
        }

        const lesson = lessonCheck.rows[0];
        //console.log('Found lesson:', lesson);

        // Verifica iscrizione al corso
        const enrollmentCheck = await pool.query(
            `SELECT id FROM course_enrollments 
             WHERE user_id = $1 AND course_id = $2`,
            [req.user.id, lesson.course_id]
        );

        // console.log('Enrollment check:', {
        //     userId: req.user.id,
        //     courseId: lesson.course_id,
        //     found: enrollmentCheck.rows.length > 0
        // });

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
        console.error('Error in lesson detail route:', {
            error: error.message,
            stack: error.stack
        });
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
            templateType = 'theory',  // aggiungo default value
            estimatedMinutes = 30,    // aggiungo default value
            metaDescription = '',     // aggiungo default value
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

        // Aggiungo log per debug
        // console.log('Creating lesson with:', {
        //     courseId,
        //     title,
        //     content: content?.substring(0, 50), // log solo primi 50 caratteri
        //     orderNumber,
        //     contentFormat,
        //     metaDescription,
        //     estimatedMinutes,
        //     status
        // });

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
        console.error('Error creating lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella creazione della lezione',
            error: error.message  // aggiungo dettaglio errore per debug
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
        console.error('Error updating lesson status:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel cambio di stato della lezione'
        });
    }
});

export default router;