import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { getCachedData, cacheData } from '../config/redis.js';
import { SERVER_CONFIG } from '../config/environments.js';


const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const cacheKey = `profile:${req.user.id}`;
        
        if (!SERVER_CONFIG.isTest) {
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return res.json({
                    success: true,
                    data: cachedData
                });
            }
        }

        // Query per i dati base dell'utente
        const userQuery = await pool.query(`
            SELECT 
                email, 
                created_at as member_since
            FROM users 
            WHERE id = $1
        `, [req.user.id]);

        // Query per il profilo
        const profileQuery = await pool.query(`
            SELECT 
                full_name, bio, avatar_url, linkedin_url, github_url, 
                website_url, skills, interests
            FROM user_profiles
            WHERE user_id = $1
        `, [req.user.id]);

        // Query per le preferenze
        const preferencesQuery = await pool.query(`
            SELECT notification_email, preferred_difficulty, theme, language
            FROM user_preferences
            WHERE user_id = $1
        `, [req.user.id]);

        // Query per le statistiche
        const statsQuery = await pool.query(`
            SELECT 
                COUNT(DISTINCT ce.course_id) as total_courses,
                COUNT(DISTINCT CASE WHEN ce.completed THEN ce.course_id END) as completed_courses,
                COUNT(DISTINCT lp.lesson_id) as total_lessons_completed
            FROM course_enrollments ce
            LEFT JOIN lesson_progress lp ON lp.user_id = ce.user_id
            WHERE ce.user_id = $1
        `, [req.user.id]);

        const response = {
            ...userQuery.rows[0],
            profile: profileQuery.rows[0] || {
                full_name: null,
                bio: null,
                avatar_url: null,
                linkedin_url: null,
                github_url: null,
                website_url: null,
                skills: [],
                interests: []
            },
            preferences: preferencesQuery.rows[0] || {
                notification_email: true,
                preferred_difficulty: 'beginner',
                theme: 'light',
                language: 'it'
            },
            stats: statsQuery.rows[0] || {
                total_courses: 0,
                completed_courses: 0,
                total_lessons_completed: 0
            }
        };

        if (!SERVER_CONFIG.isTest) {
            await cacheData(cacheKey, response, 300);
        }

        res.json({
            success: true,
            data: response
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Profile Error:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero del profilo',
            error: error.message
        });
    }
});

router.put('/', authenticateToken, async (req, res) => {
    const {
        full_name,
        bio,
        avatar_url,
        linkedin_url,
        github_url,
        website_url,
        skills,
        interests
    } = req.body;

    try {
        await pool.query(`
            INSERT INTO user_profiles (
                user_id, full_name, bio, avatar_url, linkedin_url, 
                github_url, website_url, skills, interests, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) 
            DO UPDATE SET
                full_name = EXCLUDED.full_name,
                bio = EXCLUDED.bio,
                avatar_url = EXCLUDED.avatar_url,
                linkedin_url = EXCLUDED.linkedin_url,
                github_url = EXCLUDED.github_url,
                website_url = EXCLUDED.website_url,
                skills = EXCLUDED.skills,
                interests = EXCLUDED.interests,
                updated_at = CURRENT_TIMESTAMP
        `, [
            req.user.id, full_name, bio, avatar_url, linkedin_url,
            github_url, website_url, skills, interests
        ]);

        res.json({
            success: true,
            message: 'Profilo aggiornato con successo'
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error updating profile:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento del profilo'
        });
    }
});

router.put('/preferences', authenticateToken, async (req, res) => {
    const {
        notification_email,
        preferred_difficulty,
        theme,
        language
    } = req.body;

    try {
        // Valida le preferenze
        if (preferred_difficulty && !['beginner', 'intermediate', 'advanced'].includes(preferred_difficulty)) {
            return res.status(400).json({
                success: false,
                message: 'Livello di difficoltà non valido'
            });
        }

        if (theme && !['light', 'dark'].includes(theme)) {
            return res.status(400).json({
                success: false,
                message: 'Tema non valido'
            });
        }

        await pool.query(`
            INSERT INTO user_preferences (
                user_id, notification_email, preferred_difficulty, 
                theme, language, updated_at
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) 
            DO UPDATE SET
                notification_email = EXCLUDED.notification_email,
                preferred_difficulty = EXCLUDED.preferred_difficulty,
                theme = EXCLUDED.theme,
                language = EXCLUDED.language,
                updated_at = CURRENT_TIMESTAMP
        `, [
            req.user.id, notification_email, preferred_difficulty,
            theme, language
        ]);

        res.json({
            success: true,
            message: 'Preferenze aggiornate con successo'
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error updating preferences:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento delle preferenze'
        });
    }
});

export default router;