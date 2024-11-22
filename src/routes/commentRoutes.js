import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';

dotenv.config();
const { Pool } = pg;
const router = express.Router();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del commento
 *         content:
 *           type: string
 *           description: Contenuto del commento
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data di creazione
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Data di ultima modifica
 *         parent_id:
 *           type: integer
 *           nullable: true
 *           description: ID del commento padre (per risposte)
 *         user_name:
 *           type: string
 *           description: Nome dell'utente che ha scritto il commento
 */

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: API per la gestione dei commenti
 */

/**
 * @swagger
 * /api/comments/lesson/{lessonId}:
 *   get:
 *     summary: Recupera tutti i commenti di una lezione
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID della lezione
 *     responses:
 *       200:
 *         description: Lista dei commenti recuperata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Non autorizzato
 *       500:
 *         description: Errore del server
 */
router.get('/lesson/:lessonId', authenticateToken, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const query = `
            SELECT 
                c.id,
                c.content,
                c.created_at,
                c.updated_at,
                c.parent_id,
                u.name as user_name
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.lesson_id = $1 AND c.is_deleted = FALSE
            ORDER BY c.created_at DESC
        `;
        const { rows } = await pool.query(query, [lessonId]);
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ 
            success: false,
            message: 'Errore nel recupero dei commenti'
        });
    }
});

/**
 * @swagger
 * /api/comments/lesson/{lessonId}:
 *   post:
 *     summary: Aggiunge un nuovo commento
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID della lezione
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Contenuto del commento
 *               parentId:
 *                 type: integer
 *                 description: ID del commento padre (opzionale)
 *     responses:
 *       201:
 *         description: Commento creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Non autorizzato
 *       500:
 *         description: Errore del server
 */
router.post('/lesson/:lessonId', authenticateToken, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { content, parentId } = req.body;
        const userId = req.user.id;

        const query = `
            INSERT INTO comments (lesson_id, user_id, content, parent_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id, content, created_at
        `;
        const { rows } = await pool.query(query, [lessonId, userId, content, parentId || null]);
        res.status(201).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ 
            success: false,
            message: 'Errore nella creazione del commento'
        });
    }
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     summary: Modifica un commento esistente
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del commento da modificare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Nuovo contenuto del commento
 *     responses:
 *       200:
 *         description: Commento aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Non autorizzato
 *       404:
 *         description: Commento non trovato o non autorizzato
 *       500:
 *         description: Errore del server
 */
router.put('/:commentId', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const query = `
            UPDATE comments 
            SET content = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND user_id = $3 AND is_deleted = FALSE
            RETURNING id, content, updated_at
        `;
        const { rows } = await pool.query(query, [content, commentId, userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Commento non trovato o non autorizzato'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ 
            success: false,
            message: 'Errore nell\'aggiornamento del commento'
        });
    }
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Elimina un commento (soft delete)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del commento da eliminare
 *     responses:
 *       200:
 *         description: Commento eliminato con successo
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
 *                   example: Commento eliminato con successo
 *       401:
 *         description: Non autorizzato
 *       404:
 *         description: Commento non trovato o non autorizzato
 *       500:
 *         description: Errore del server
 */
router.delete('/:commentId', authenticateToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const query = `
            UPDATE comments
            SET is_deleted = TRUE
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `;
        const { rows } = await pool.query(query, [commentId, userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Commento non trovato o non autorizzato'
            });
        }
        
        res.json({
            success: true,
            message: 'Commento eliminato con successo'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ 
            success: false,
            message: 'Errore nell\'eliminazione del commento'
        });
    }
});

export default router;