import express from 'express';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { generateToken, authenticateToken, isAdmin } from '../middleware/auth.js';

dotenv.config();
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
/**
 * @swagger
 * components:
 *   schemas:
 *     AuthError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 */
 
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API per gestire l'autenticazione degli utenti
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Effettua il login di un utente
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       '200':
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                 token:
 *                   type: string
 *       '400':
 *         description: Dati mancanti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       '401':
 *         description: Credenziali non valide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email e password sono richiesti' 
      });
    }

    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenziali non valide' 
      });
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenziali non valide' 
      });
    }

    const token = generateToken(user);

    res.json({ 
      success: true,
      message: 'Login effettuato con successo',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Recupera il profilo dell'utente autenticato
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Profilo recuperato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       '401':
 *         description: Non autorizzato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 */
router.get('/profile', authenticateToken, async (req, res) => {
  res.json({ 
    success: true,
    message: 'Profilo utente recuperato con successo',
    user: req.user 
  });
});

/**
 * @swagger
 * /api/auth/admin:
 *   get:
 *     summary: Route protetta solo per amministratori
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Accesso admin consentito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       '401':
 *         description: Token non valido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       '403':
 *         description: Accesso negato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 */
router.get('/admin', authenticateToken, isAdmin, (req, res) => {
  res.json({ 
    success: true,
    message: 'Accesso admin consentito',
    user: req.user
  });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Effettua il logout dell'utente
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Logout effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       '401':
 *         description: Non autorizzato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Se stai usando una blacklist di token, aggiungi il token corrente
    // await redis.sadd('token_blacklist', req.token);
    
    // In ogni caso, rispondi con successo
    res.json({ 
      success: true,
      message: 'Logout effettuato con successo' 
    });
  } catch (error) {
    next(error);
  }
});

export default router;