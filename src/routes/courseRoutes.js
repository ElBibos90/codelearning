import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { courseValidation } from '../middleware/validators.js';
import { sanitizeContent } from '../utils/sanitize.js';
import { getCachedData, cacheData } from '../config/redis.js';

dotenv.config();
const router = express.Router();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

router.get('/:courseId', authenticateToken, async (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);
        
        const result = await pool.query(`
            WITH enrollment_info AS (
                SELECT 
                    ce.course_id,
                    COUNT(DISTINCT ce.user_id) as enrolled_count,
                    bool_or(ce.user_id = $1) as is_enrolled,
                    bool_or(ce.completed) as is_completed,
                    COUNT(DISTINCT CASE WHEN lp.completed = true AND lp.user_id = $1 THEN lp.lesson_id END) as completed_lessons
                FROM course_enrollments ce
                LEFT JOIN lesson_progress lp ON lp.user_id = ce.user_id
                WHERE ce.course_id = $2
                GROUP BY ce.course_id
            )
            SELECT 
                c.*,
                COUNT(DISTINCT l.id) as total_lessons,
                COALESCE(ei.enrolled_count, 0) as enrolled_count,
                COALESCE(ei.is_enrolled, false) as is_enrolled,
                COALESCE(ei.is_completed, false) as completed,
                COALESCE(ei.completed_lessons, 0) as completed_lessons,
                COALESCE(
                    json_agg(
                        jsonb_build_object(
                            'id', l.id,
                            'title', l.title,
                            'content', l.content,
                            'order_number', l.order_number,
                            'completed', COALESCE((
                                SELECT completed 
                                FROM lesson_progress lp 
                                WHERE lp.lesson_id = l.id AND lp.user_id = $1
                            ), false)
                        ) ORDER BY l.order_number
                    ) FILTER (WHERE l.id IS NOT NULL),
                    '[]'
                ) as lessons
            FROM courses c
            LEFT JOIN lessons l ON c.id = l.course_id
            LEFT JOIN enrollment_info ei ON ei.course_id = c.id
            WHERE c.id = $2
            GROUP BY c.id, ei.enrolled_count, ei.is_enrolled, ei.is_completed, ei.completed_lessons
        `, [req.user.id, courseId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Corso non trovato'
            });
        }

        // Formatta i dati per assicurare il corretto conteggio
        const courseData = {
            ...result.rows[0],
            completed_lessons: parseInt(result.rows[0].completed_lessons) || 0,
            total_lessons: parseInt(result.rows[0].total_lessons) || 0,
            lessons: result.rows[0].lessons || []
        };

        res.json({
            success: true,
            data: courseData
        });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero del corso'
        });
    }
});

// GET /courses - Lista di tutti i corsi
// In courseRoutes.js
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Check cache first
        const cacheKey = `courses:all:${req.user.id}`;
        const cachedData = await getCachedData(cacheKey);
        
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData
            });
        }

        const query = `
            WITH enrollment_info AS (
                SELECT 
                    ce.course_id,
                    COUNT(DISTINCT ce.user_id) as enrolled_count,
                    bool_or(ce.user_id = $1) as is_enrolled
                FROM course_enrollments ce
                GROUP BY ce.course_id
            ),
            lesson_progress_info AS (
                SELECT
                    l.course_id,
                    COUNT(DISTINCT CASE WHEN lp.completed = true AND lp.user_id = $1 THEN lp.lesson_id END) as completed_lessons
                FROM lessons l
                LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id
                GROUP BY l.course_id
            ),
            lesson_counts AS (
                SELECT 
                    course_id,
                    COUNT(*) as total_lessons
                FROM lessons
                GROUP BY course_id
            )
            SELECT 
                c.*,
                COALESCE(lc.total_lessons, 0) as total_lessons,
                COALESCE(ei.enrolled_count, 0) as enrolled_count,
                COALESCE(ei.is_enrolled, false) as is_enrolled,
                COALESCE(lpi.completed_lessons, 0) as completed_lessons
            FROM courses c
            LEFT JOIN lesson_counts lc ON lc.course_id = c.id
            LEFT JOIN enrollment_info ei ON ei.course_id = c.id
            LEFT JOIN lesson_progress_info lpi ON lpi.course_id = c.id
            ORDER BY c.created_at DESC;
        `;
        
        const { rows } = await pool.query(query, [req.user.id]);
        
        const formattedRows = rows.map(row => {
            const totalLessons = parseInt(row.total_lessons) || 0;
            const completedLessons = parseInt(row.completed_lessons) || 0;
            
            return {
                ...row,
                created_at: new Date(row.created_at).toISOString(),
                updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
                total_lessons: totalLessons,
                completed_lessons: Math.min(completedLessons, totalLessons),
                progress_percentage: totalLessons ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0
            };
        });

        // Cache the formatted results
        await cacheData(cacheKey, formattedRows, 300); // cache for 5 minutes
        
        res.json({
            success: true,
            data: formattedRows
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dei corsi'
        });
    }
});

// POST /courses - Crea nuovo corso (solo admin)
router.post('/', authenticateToken, isAdmin, courseValidation, async (req, res) => {
    try {
        const { title, description, difficulty_level, duration_hours } = req.body;
        
        // Sanitizza la descrizione
        const sanitizedDescription = sanitizeContent(description);
        
        const result = await pool.query(
            `INSERT INTO courses (title, description, difficulty_level, duration_hours)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [title, sanitizedDescription, difficulty_level, duration_hours]
        );
        
        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// PUT /courses/:courseId - Aggiorna corso (solo admin)
router.put('/:courseId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description, difficulty_level, duration_hours } = req.body;
        
        const checkQuery = 'SELECT id FROM courses WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [courseId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Corso non trovato'
            });
        }

        let updateQuery = 'UPDATE courses SET ';
        const values = [];
        let paramCount = 1;
        const updates = [];

        if (title !== undefined) {
            updates.push(`title = $${paramCount}`);
            values.push(title);
            paramCount++;
        }

        if (description !== undefined) {
            updates.push(`description = $${paramCount}`);
            values.push(description);
            paramCount++;
        }

        if (difficulty_level !== undefined) {
            const validDifficultyLevels = ['beginner', 'intermediate', 'advanced'];
            if (!validDifficultyLevels.includes(difficulty_level)) {
                return res.status(400).json({
                    success: false,
                    message: 'Livello di difficoltà non valido'
                });
            }
            updates.push(`difficulty_level = $${paramCount}`);
            values.push(difficulty_level);
            paramCount++;
        }

        if (duration_hours !== undefined) {
            updates.push(`duration_hours = $${paramCount}`);
            values.push(duration_hours);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nessun campo da aggiornare fornito'
            });
        }

        updateQuery += updates.join(', ') + `, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
        values.push(courseId);

        const { rows } = await pool.query(updateQuery, values);
        
        res.json({
            success: true,
            message: 'Corso aggiornato con successo',
            data: rows[0]
        });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento del corso'
        });
    }
});

// DELETE /courses/:courseId - Elimina corso (solo admin)
router.delete('/:courseId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { courseId } = req.params;

        const checkQuery = 'SELECT id FROM courses WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [courseId]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Corso non trovato'
            });
        }
        
        // La cancellazione a cascata gestirà lezioni e iscrizioni
        const query = `
            DELETE FROM courses
            WHERE id = $1
            RETURNING id;
        `;
        
        await pool.query(query, [courseId]);
        
        res.json({
            success: true,
            message: 'Corso e relative lezioni eliminati con successo'
        });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nell\'eliminazione del corso'
        });
    }
});

export default router;