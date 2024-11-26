import express from 'express';
import pg from 'pg';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import dotenv from 'dotenv';
import { getCachedData, cacheData } from '../config/redis.js';

dotenv.config();

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/**
 * @swagger
 * components:
 *   schemas:
 *     UserStats:
 *       type: object
 *       properties:
 *         total_courses_enrolled:
 *           type: integer
 *           description: Numero totale di corsi a cui l'utente è iscritto
 *         completed_courses:
 *           type: integer
 *           description: Numero di corsi completati
 *         completed_lessons:
 *           type: integer
 *           description: Numero totale di lezioni completate
 *         recent_activities:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               lesson_title:
 *                 type: string
 *               course_title:
 *                 type: string
 *               completed_at:
 *                 type: string
 *                 format: date-time
 *         ongoing_courses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               course_id:
 *                 type: integer
 *               total_lessons:
 *                 type: integer
 *               completed_lessons:
 *                 type: integer
 * 
 *     AdminOverview:
 *       type: object
 *       properties:
 *         total_courses:
 *           type: integer
 *           description: Numero totale di corsi sulla piattaforma
 *         total_lessons:
 *           type: integer
 *           description: Numero totale di lezioni
 *         total_enrollments:
 *           type: integer
 *           description: Numero totale di iscrizioni
 *         completed_enrollments:
 *           type: integer
 *           description: Numero di corsi completati dagli utenti
 *         popular_courses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               enrollment_count:
 *                 type: integer
 *               completion_rate:
 *                 type: number
 *                 format: float
 *         recent_enrollments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user_email:
 *                 type: string
 *               course_title:
 *                 type: string
 *               enrolled_at:
 *                 type: string
 *                 format: date-time
 * 
 *     CourseStats:
 *       type: object
 *       properties:
 *         course_info:
 *           type: object
 *           properties:
 *             total_enrollments:
 *               type: integer
 *             completed_enrollments:
 *               type: integer
 *             total_lessons:
 *               type: integer
 *         user_completed_lessons:
 *           type: integer
 *         lesson_stats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               lesson_title:
 *                 type: string
 *               completion_count:
 *                 type: integer
 */

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: API per le statistiche della piattaforma
 */

/**
 * @swagger
 * /api/stats/user:
 *   get:
 *     summary: Recupera statistiche dell'utente
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiche recuperate con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserStats'
 *       401:
 *         description: Non autorizzato
 *       500:
 *         description: Errore nel recupero delle statistiche
 */
router.get('/user', authenticateToken, async (req, res) => {
    try {
        const stats = await pool.query(`
            WITH user_stats AS (
                SELECT 
                    COUNT(DISTINCT ce.course_id) as total_courses_enrolled,
                    COUNT(DISTINCT CASE WHEN ce.completed = true THEN ce.course_id END) as completed_courses,
                    COUNT(DISTINCT lp.lesson_id) as completed_lessons
                FROM course_enrollments ce
                LEFT JOIN lesson_progress lp ON lp.user_id = ce.user_id AND lp.completed = true
                WHERE ce.user_id = $1
            ),
            recent_activity AS (
                SELECT 
                    l.title as lesson_title,
                    c.title as course_title,
                    lp.completed_at
                FROM lesson_progress lp
                JOIN lessons l ON l.id = lp.lesson_id
                JOIN courses c ON c.id = l.course_id
                WHERE lp.user_id = $1 AND lp.completed = true
                ORDER BY lp.completed_at DESC
                LIMIT 5
            ),
            course_progress AS (
                SELECT 
                    c.title,
                    c.id as course_id,
                    COUNT(DISTINCT l.id) as total_lessons,
                    COUNT(DISTINCT CASE WHEN lp.completed = true THEN lp.lesson_id END) as completed_lessons
                FROM course_enrollments ce
                JOIN courses c ON c.id = ce.course_id
                LEFT JOIN lessons l ON l.course_id = c.id
                LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
                WHERE ce.user_id = $1 AND ce.completed = false
                GROUP BY c.id, c.title
            )
            SELECT 
                us.*,
                json_agg(DISTINCT ra.*) as recent_activities,
                json_agg(DISTINCT cp.*) as ongoing_courses
            FROM user_stats us
            CROSS JOIN recent_activity ra
            CROSS JOIN course_progress cp
            GROUP BY us.total_courses_enrolled, us.completed_courses, us.completed_lessons
        `, [req.user.id]);

        res.json({
            success: true,
            data: stats.rows[0] || {
                total_courses_enrolled: 0,
                completed_courses: 0,
                completed_lessons: 0,
                recent_activities: [],
                ongoing_courses: []
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle statistiche'
        });
    }
});

/**
 * @swagger
 * /api/stats/admin/overview:
 *   get:
 *     summary: Recupera panoramica generale (solo admin)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Panoramica recuperata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AdminOverview'
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato (non admin)
 */
router.get('/admin/overview', authenticateToken, isAdmin, async (req, res) => {
    try {
        const cacheKey = 'stats:admin:overview';
        
        const cachedData = await getCachedData(cacheKey);
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData
            });
        }

        const stats = await pool.query(`
            WITH course_stats AS (
                SELECT 
                    COUNT(DISTINCT c.id) as total_courses,
                    COUNT(DISTINCT l.id) as total_lessons,
                    COUNT(DISTINCT ce.id) as total_enrollments,
                    COUNT(DISTINCT CASE WHEN ce.completed = true THEN ce.id END) as completed_enrollments
                FROM courses c
                LEFT JOIN lessons l ON l.course_id = c.id
                LEFT JOIN course_enrollments ce ON ce.course_id = c.id
            ),
            popular_courses AS (
                SELECT 
                    c.title,
                    COUNT(ce.id) as enrollment_count,
                    COUNT(CASE WHEN ce.completed = true THEN 1 END)::float / COUNT(ce.id) * 100 as completion_rate
                FROM courses c
                JOIN course_enrollments ce ON ce.course_id = c.id
                GROUP BY c.id, c.title
                ORDER BY enrollment_count DESC
                LIMIT 5
            ),
            recent_enrollments AS (
                SELECT 
                    u.email as user_email,
                    c.title as course_title,
                    ce.enrolled_at
                FROM course_enrollments ce
                JOIN users u ON u.id = ce.user_id
                JOIN courses c ON c.id = ce.course_id
                ORDER BY ce.enrolled_at DESC
                LIMIT 5
            )
            SELECT 
                cs.*,
                json_agg(DISTINCT pc.*) as popular_courses,
                json_agg(DISTINCT re.*) as recent_enrollments
            FROM course_stats cs
            CROSS JOIN popular_courses pc
            CROSS JOIN recent_enrollments re
            GROUP BY cs.total_courses, cs.total_lessons, cs.total_enrollments, cs.completed_enrollments
        `);

        await cacheData(cacheKey, stats.rows[0], 300);

        res.json({
            success: true,
            data: stats.rows[0]
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle statistiche amministrative'
        });
    }
});

/**
 * @swagger
 * /api/stats/course/{courseId}:
 *   get:
 *     summary: Recupera statistiche di un corso specifico
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del corso
 *     responses:
 *       200:
 *         description: Statistiche del corso recuperate con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CourseStats'
 *       404:
 *         description: Corso non trovato
 */
router.get('/course/:courseId', authenticateToken, async (req, res) => {
    try {
        const cacheKey = `stats:course:${req.params.courseId}:${req.user.id}`;
        
        const cachedData = await getCachedData(cacheKey);
        if (cachedData) {
            return res.json({
                success: true,
                data: cachedData
            });
        }

        const courseStats = await pool.query(`
            WITH course_info AS (
                SELECT 
                    c.id,
                    c.title,
                    c.description,
                    COUNT(DISTINCT ce.user_id) as total_enrollments,
                    COUNT(DISTINCT CASE WHEN ce.completed THEN ce.user_id END) as completed_enrollments,
                    COUNT(DISTINCT l.id) as total_lessons
                FROM courses c
                LEFT JOIN course_enrollments ce ON ce.course_id = c.id
                LEFT JOIN lessons l ON l.course_id = c.id
                WHERE c.id = $1
                GROUP BY c.id
            )
            SELECT *
            FROM course_info
        `, [req.params.courseId]);

        if (courseStats.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Corso non trovato'
            });
        }

        await cacheData(cacheKey, courseStats.rows[0], 300);

        res.json({
            success: true,
            data: courseStats.rows[0]
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle statistiche del corso',
            error: error.message
        });
    }
});

export default router;