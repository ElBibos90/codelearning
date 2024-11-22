import express from 'express';
import pg from 'pg';
import { authenticateToken } from '../middleware/auth.js';
import dotenv from 'dotenv';

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
 *     UserProfile:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email dell'utente
 *         member_since:
 *           type: string
 *           format: date-time
 *           description: Data di registrazione
 *         profile:
 *           type: object
 *           properties:
 *             full_name:
 *               type: string
 *               description: Nome completo dell'utente
 *             bio:
 *               type: string
 *               description: Biografia dell'utente
 *             avatar_url:
 *               type: string
 *               format: uri
 *               description: URL dell'avatar
 *             linkedin_url:
 *               type: string
 *               format: uri
 *               description: URL profilo LinkedIn
 *             github_url:
 *               type: string
 *               format: uri
 *               description: URL profilo GitHub
 *             website_url:
 *               type: string
 *               format: uri
 *               description: URL sito web personale
 *             skills:
 *               type: array
 *               items:
 *                 type: string
 *               description: Lista delle competenze
 *             interests:
 *               type: array
 *               items:
 *                 type: string
 *               description: Lista degli interessi
 *         preferences:
 *           type: object
 *           properties:
 *             notification_email:
 *               type: boolean
 *               description: Preferenza notifiche email
 *             preferred_difficulty:
 *               type: string
 *               enum: [beginner, intermediate, advanced]
 *               description: Livello di difficoltà preferito
 *             theme:
 *               type: string
 *               enum: [light, dark]
 *               description: Tema preferito
 *             language:
 *               type: string
 *               description: Lingua preferita
 *         stats:
 *           type: object
 *           properties:
 *             total_courses:
 *               type: integer
 *               description: Numero totale di corsi
 *             completed_courses:
 *               type: integer
 *               description: Numero di corsi completati
 *             total_lessons_completed:
 *               type: integer
 *               description: Numero totale di lezioni completate
 */

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: API per la gestione del profilo utente
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Recupera il profilo completo dell'utente
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profilo recuperato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Non autorizzato
 *       500:
 *         description: Errore nel recupero del profilo
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Query per i dati base dell'utente
        const userQuery = await pool.query(`
            SELECT email, created_at as member_since
            FROM users 
            WHERE id = $1
        `, [req.user.id]);

        // Query per il profilo
        const profileQuery = await pool.query(`
            SELECT full_name, bio, avatar_url, linkedin_url, github_url, 
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

        res.json({
            success: true,
            data: response
        });
    } catch (err) {
        console.error('Errore nel recupero del profilo:', err);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero del profilo'
        });
    }
});

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Aggiorna il profilo dell'utente
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *                 format: uri
 *               linkedin_url:
 *                 type: string
 *                 format: uri
 *               github_url:
 *                 type: string
 *                 format: uri
 *               website_url:
 *                 type: string
 *                 format: uri
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profilo aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profilo aggiornato con successo
 *       500:
 *         description: Errore nell'aggiornamento del profilo
 */
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
    } catch (err) {
        console.error('Errore nell\'aggiornamento del profilo:', err);
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento del profilo'
        });
    }
});

/**
 * @swagger
 * /api/profile/preferences:
 *   put:
 *     summary: Aggiorna le preferenze dell'utente
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notification_email:
 *                 type: boolean
 *               preferred_difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               theme:
 *                 type: string
 *                 enum: [light, dark]
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preferenze aggiornate con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Preferenze aggiornate con successo
 *       500:
 *         description: Errore nell'aggiornamento delle preferenze
 */
router.put('/preferences', authenticateToken, async (req, res) => {
    const {
        notification_email,
        preferred_difficulty,
        theme,
        language
    } = req.body;

    try {
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
    } catch (err) {
        console.error('Errore nell\'aggiornamento delle preferenze:', err);
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento delle preferenze'
        });
    }
});

export default router;