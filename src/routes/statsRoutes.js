import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { getCachedData, cacheData } from '../config/redis.js';
import { SERVER_CONFIG } from '../config/environments.js';


const router = express.Router();

router.get('/user', authenticateToken, async (req, res) => {
    try {
        const cacheKey = `stats:user:${req.user.id}`;
        
        if (!SERVER_CONFIG.isTest) {
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return res.json({
                    success: true,
                    data: cachedData
                });
            }
        }

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

        const result = stats.rows[0] || {
            total_courses_enrolled: 0,
            completed_courses: 0,
            completed_lessons: 0,
            recent_activities: [],
            ongoing_courses: []
        };

        if (!SERVER_CONFIG.isTest) {
            await cacheData(cacheKey, result, 300);
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Stats Error:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle statistiche'
        });
    }
});

router.get('/admin/overview', authenticateToken, isAdmin, async (req, res) => {
    try {
        const cacheKey = 'stats:admin:overview';
        
        if (!SERVER_CONFIG.isTest) {
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return res.json({
                    success: true,
                    data: cachedData
                });
            }
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

        if (!SERVER_CONFIG.isTest) {
            await cacheData(cacheKey, stats.rows[0], 300);
        }

        res.json({
            success: true,
            data: stats.rows[0]
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Admin Stats Error:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle statistiche amministrative'
        });
    }
});

router.get('/course/:courseId', authenticateToken, async (req, res) => {
    try {
        const cacheKey = `stats:course:${req.params.courseId}:${req.user.id}`;
        
        if (!SERVER_CONFIG.isTest) {
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return res.json({
                    success: true,
                    data: cachedData
                });
            }
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

        if (!SERVER_CONFIG.isTest) {
            await cacheData(cacheKey, courseStats.rows[0], 300);
        }

        res.json({
            success: true,
            data: courseStats.rows[0]
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Course Stats Error:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle statistiche del corso'
        });
    }
});

export default router;