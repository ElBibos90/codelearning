import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// POST /enrollments/:courseId - Iscrizione a un corso
router.post('/:courseId', authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

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

        // Verifica se l'utente è già iscritto
        const enrollmentCheck = await pool.query(
            'SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
            [userId, courseId]
        );

        if (enrollmentCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Sei già iscritto a questo corso'
            });
        }

        // Crea l'iscrizione
        const query = `
            INSERT INTO course_enrollments (user_id, course_id, enrolled_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        await pool.query(query, [userId, courseId]);

        // Crea i record di progresso per ogni lezione del corso
        await pool.query(`
            INSERT INTO lesson_progress (user_id, lesson_id, created_at)
            SELECT $1, l.id, CURRENT_TIMESTAMP
            FROM lessons l
            WHERE l.course_id = $2
        `, [userId, courseId]);

        res.status(201).json({
            success: true,
            message: 'Iscrizione al corso effettuata con successo'
        });
    } catch (error) {
        console.error('Error enrolling in course:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante l\'iscrizione al corso'
        });
    }
});

// enrollmentRoutes.js
router.get('/my-courses', authenticateToken, async (req, res) => {
    try {
        const cacheKey = `enrollments:my-courses:${req.user.id}`;
        
        const cachedData = await getCachedData(cacheKey);
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData
            });
        }

        const result = await pool.query(`
            WITH course_progress AS (
                SELECT 
                    ce.course_id,
                    COUNT(DISTINCT lp.lesson_id) as completed_lessons,
                    COUNT(DISTINCT l.id) as total_lessons
                FROM course_enrollments ce
                LEFT JOIN lessons l ON l.course_id = ce.course_id
                LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id 
                    AND lp.user_id = ce.user_id 
                    AND lp.completed = true
                WHERE ce.user_id = $1
                GROUP BY ce.course_id
            )
            SELECT 
                c.*,
                cp.completed_lessons,
                cp.total_lessons,
                CASE 
                    WHEN cp.total_lessons = 0 THEN 0
                    ELSE ROUND((cp.completed_lessons::float / cp.total_lessons::float) * 100)
                END as progress_percentage,
                ce.enrolled_at,
                ce.completed as course_completed,
                ce.completed_at as course_completed_at,
                (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as enrolled_count
            FROM courses c
            JOIN course_enrollments ce ON ce.course_id = c.id
            LEFT JOIN course_progress cp ON cp.course_id = c.id
            WHERE ce.user_id = $1
            ORDER BY ce.enrolled_at DESC
        `, [req.user.id]);

        await cacheData(cacheKey, result.rows, 300);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dei corsi'
        });
    }
});

// POST /enrollments/:courseId/complete - Completa un corso
router.post('/:courseId/complete', authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        // Verifica che tutte le lezioni siano state completate
        const progressCheck = await pool.query(`
            WITH course_lessons AS (
                SELECT COUNT(*) as total_lessons
                FROM lessons
                WHERE course_id = $1
            ),
            completed_lessons AS (
                SELECT COUNT(*) as completed_count
                FROM lessons l
                JOIN lesson_progress lp ON lp.lesson_id = l.id
                WHERE l.course_id = $1
                AND lp.user_id = $2
                AND lp.completed = true
            )
            SELECT 
                cl.total_lessons,
                COALESCE(cpl.completed_count, 0) as completed_count
            FROM course_lessons cl
            CROSS JOIN completed_lessons cpl
        `, [courseId, userId]);

        const { total_lessons, completed_count } = progressCheck.rows[0];

        if (completed_count < total_lessons) {
            return res.status(400).json({
                success: false,
                message: 'Non puoi completare il corso finché non hai completato tutte le lezioni'
            });
        }

        // Aggiorna lo stato del corso
        await pool.query(
            `UPDATE course_enrollments 
             SET completed = true, completed_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND course_id = $2`,
            [userId, courseId]
        );

        res.json({
            success: true,
            message: 'Corso completato con successo'
        });
    } catch (error) {
        console.error('Error completing course:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante il completamento del corso'
        });
    }
});

// GET /enrollments/course/:courseId/progress - Progresso di un corso specifico
router.get('/course/:courseId/progress', authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const result = await pool.query(`
            WITH lesson_stats AS (
                SELECT 
                    COUNT(DISTINCT l.id) as total_lessons,
                    COUNT(DISTINCT CASE WHEN lp.completed THEN l.id END) as completed_lessons
                FROM lessons l
                LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id 
                    AND lp.user_id = $1
                WHERE l.course_id = $2
            )
            SELECT 
                ls.*,
                ce.enrolled_at,
                ce.completed as course_completed,
                ce.completed_at as course_completed_at,
                CASE 
                    WHEN ls.total_lessons = 0 THEN 0
                    ELSE ROUND((ls.completed_lessons::float / ls.total_lessons::float) * 100)
                END as progress_percentage
            FROM lesson_stats ls
            JOIN course_enrollments ce ON ce.course_id = $2 AND ce.user_id = $1
        `, [userId, courseId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Iscrizione al corso non trovata'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching course progress:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero del progresso del corso'
        });
    }
});

export default router;