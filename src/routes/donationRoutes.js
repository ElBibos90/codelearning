import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { donationService } from '../services/donationService.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Donation:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID della donazione
 *         transaction_id:
 *           type: string
 *           description: ID univoco della transazione
 *         email:
 *           type: string
 *           format: email
 *           description: Email del donatore
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 1
 *           description: Importo della donazione
 *         currency:
 *           type: string
 *           default: EUR
 *           description: Valuta della donazione
 *         message:
 *           type: string
 *           description: Messaggio opzionale del donatore
 *         from_name:
 *           type: string
 *           description: Nome del donatore
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Data e ora della donazione
 *         is_test:
 *           type: boolean
 *           default: false
 *           description: Indica se è una donazione di test
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data e ora di creazione del record
 *     
 *     DonationStats:
 *       type: object
 *       properties:
 *         total_donations:
 *           type: integer
 *           description: Numero totale di donazioni
 *         total_amount:
 *           type: number
 *           description: Importo totale delle donazioni
 *         avg_amount:
 *           type: number
 *           description: Importo medio delle donazioni
 *         first_donation:
 *           type: string
 *           format: date-time
 *           description: Data della prima donazione
 *         last_donation:
 *           type: string
 *           format: date-time
 *           description: Data dell'ultima donazione
 *         test_donations_count:
 *           type: integer
 *           description: Numero di donazioni di test
 */

/**
 * @swagger
 * tags:
 *   name: Donations
 *   description: API per la gestione delle donazioni
 */

/**
 * @swagger
 * /api/donations/test:
 *   post:
 *     summary: Crea una donazione di test
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - amount
 *               - from_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               amount:
 *                 type: number
 *                 minimum: 1
 *               from_name:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Donazione di test creata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Donation'
 *                 message:
 *                   type: string
 *                   example: Donazione di test creata con successo
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato
 */
const validateDonation = [
    body('email').isEmail().withMessage('Email non valida'),
    body('amount').isFloat({ min: 1 }).withMessage('Importo minimo 1'),
    body('from_name').trim().notEmpty().withMessage('Nome richiesto'),
    body('message').optional().trim()
];

router.post('/test', 
    authenticateToken,
    validateDonation,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors.array() 
                });
            }

            const donation = await donationService.saveDonation({
                ...req.body,
                is_test: true
            });

            res.status(201).json({
                success: true,
                data: donation,
                message: 'Donazione di test creata con successo'
            });
        } catch (error) {
            next(error);
        }
});

/**
 * @swagger
 * /api/donations:
 *   get:
 *     summary: Recupera tutte le donazioni (solo admin)
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Numero massimo di risultati
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Numero di risultati da saltare
 *       - in: query
 *         name: includeTest
 *         schema:
 *           type: boolean
 *         description: Includere donazioni di test
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [timestamp, amount]
 *         description: Campo per ordinamento
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Direzione ordinamento
 *     responses:
 *       200:
 *         description: Lista donazioni recuperata con successo
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
 *                     $ref: '#/components/schemas/Donation'
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato (non admin)
 */
router.get('/', 
    authenticateToken, 
    isAdmin,
    [
        query('limit').optional().isInt({ min: 1 }),
        query('offset').optional().isInt({ min: 0 }),
        query('includeTest').optional().isBoolean(),
        query('sortBy').optional().isIn(['timestamp', 'amount']),
        query('sortOrder').optional().isIn(['ASC', 'DESC'])
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors.array() 
                });
            }

            const donations = await donationService.getAllDonations({
                limit: parseInt(req.query.limit) || 10,
                offset: parseInt(req.query.offset) || 0,
                includeTest: req.query.includeTest === 'true',
                sortBy: req.query.sortBy || 'timestamp',
                sortOrder: req.query.sortOrder || 'DESC'
            });
            
            res.json({
                success: true,
                data: donations
            });
        } catch (error) {
            next(error);
        }
});

/**
 * @swagger
 * /api/donations/stats:
 *   get:
 *     summary: Recupera statistiche donazioni (solo admin)
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeTest
 *         schema:
 *           type: boolean
 *         description: Includere donazioni di test nelle statistiche
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
 *                   $ref: '#/components/schemas/DonationStats'
 *       401:
 *         description: Non autorizzato
 *       403:
 *         description: Accesso negato (non admin)
 */
router.get('/stats', 
    authenticateToken, 
    isAdmin,
    query('includeTest').optional().isBoolean(),
    async (req, res, next) => {
        try {
            const stats = await donationService.getDonationStats(
                req.query.includeTest === 'true'
            );
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
});

export default router;