import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import { authenticateToken } from '../middleware/auth.js';
import dotenv from 'dotenv';
import { getCachedData, cacheData } from '../config/redis.js';

dotenv.config();
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardOverview:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: ID dell'utente
 *             name:
 *               type: string
 *               description: Nome dell'utente
 *             email:
 *               type: string
 *               description: Email dell'utente
 *             role:
 *               type: string
 *               description: Ruolo dell'utente
 *             memberSince:
 *               type: string
 *               format: date-time
 *               description: Data di registrazione
 *             lastLogin:
 *               type: string
 *               format: date-time
 *               description: Ultimo accesso
 *         stats:
 *           type: object
 *           properties:
 *             totalCorsi:
 *               type: integer
 *               description: Numero totale di corsi
 *             corsiCompleti:
 *               type: integer
 *               description: Numero di corsi completati
 *             corsiInCorso:
 *               type: integer
 *               description: Numero di corsi in corso
 *             ultimoAccesso:
 *               type: string
 *               format: date-time
 *               description: Data e ora dell'ultimo accesso
 * 
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 * 
 *     UserStats:
 *       type: object
 *       properties:
 *         tempoTotale:
 *           type: string
 *           description: Tempo totale trascorso sulla piattaforma
 *         ultimoAccesso:
 *           type: string
 *           format: date-time
 *           description: Data e ora dell'ultimo accesso
 *         sessioniCompletate:
 *           type: integer
 *           description: Numero di sessioni completate
 *         mediaPunteggio:
 *           type: number
 *           description: Media dei punteggi ottenuti
 */

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: API per la gestione della dashboard utente
 */

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Recupera panoramica dashboard utente
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Panoramica dashboard recuperata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 dashboard:
 *                   $ref: '#/components/schemas/DashboardOverview'
 *       401:
 *         description: Non autorizzato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Token di accesso non valido
 *       500:
 *         description: Errore del server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Errore durante il recupero della dashboard
 */
router.get('/overview', authenticateToken, async (req, res, next) => {
  try {
      const cacheKey = `dashboard:${req.user.id}`;
      
      const cachedData = await getCachedData(cacheKey);
      if (cachedData) {
          return res.json({
              success: true,
              dashboard: cachedData
          });
      }

      const userQuery = await pool.query(`
          SELECT 
              id, 
              name, 
              email, 
              role, 
              created_at,
              last_login
          FROM users 
          WHERE id = $1
      `, [req.user.id]);

      const statsQuery = await pool.query(`
          SELECT 
              COUNT(DISTINCT ce.course_id) as total_courses,
              COUNT(DISTINCT CASE WHEN ce.completed THEN ce.course_id END) as completed_courses,
              COUNT(DISTINCT CASE WHEN NOT ce.completed THEN ce.course_id END) as ongoing_courses
          FROM course_enrollments ce
          WHERE ce.user_id = $1
      `, [req.user.id]);

      const user = userQuery.rows[0];
      const stats = statsQuery.rows[0];

      const dashboardData = {
          user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              memberSince: user.created_at,
              lastLogin: user.last_login
          },
          stats: {
              totalCorsi: parseInt(stats.total_courses) || 0,
              corsiCompleti: parseInt(stats.completed_courses) || 0,
              corsiInCorso: parseInt(stats.ongoing_courses) || 0,
              ultimoAccesso: user.last_login
          }
      };

      await cacheData(cacheKey, dashboardData, 300);

      res.json({
          success: true,
          dashboard: dashboardData
      });
  } catch (error) {
      console.error('Dashboard Error:', error);
      res.status(500).json({
          success: false,
          message: 'Errore nel recupero della dashboard',
          error: error.message
      });
  }
});

/**
 * @swagger
 * /api/dashboard/profile:
 *   put:
 *     summary: Aggiorna il profilo dell'utente
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nuovo nome dell'utente
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Nuova email dell'utente
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
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Dati non validi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Nessun dato da aggiornare fornito
 *       401:
 *         description: Non autorizzato
 */
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: 'Nessun dato da aggiornare fornito'
      });
    }

    let updateQuery = 'UPDATE users SET ';
    const updateValues = [];
    const updateFields = [];
    
    if (name) {
      updateFields.push(`name = $${updateFields.length + 1}`);
      updateValues.push(name);
    }
    
    if (email) {
      // Verifica se l'email è già in uso
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email già in uso'
        });
      }
      
      updateFields.push(`email = $${updateFields.length + 1}`);
      updateValues.push(email);
    }
    
    updateQuery += updateFields.join(', ');
    updateQuery += ` WHERE id = $${updateFields.length + 1} RETURNING *`;
    updateValues.push(req.user.id);

    const result = await pool.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        role: result.rows[0].role
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Recupera le statistiche dell'utente
 *     tags: [Dashboard]
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
 *                 stats:
 *                   $ref: '#/components/schemas/UserStats'
 *       401:
 *         description: Non autorizzato
 */
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    res.json({
      success: true,
      stats: {
        tempoTotale: "0h",
        ultimoAccesso: new Date(),
        sessioniCompletate: 0,
        mediaPunteggio: 0
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;