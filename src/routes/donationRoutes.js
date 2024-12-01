import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { donationService } from '../services/donationService.js';
import { SERVER_CONFIG } from '../config/environments.js';


const router = express.Router();

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

            if (SERVER_CONFIG.isProduction && !req.body.force) {
                return res.status(400).json({
                    success: false,
                    message: 'Le donazioni di test non sono permesse in produzione'
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

router.post('/webhook', async (req, res) => {
    try {
        const { data } = req.body;

        // Verifica firma webhook se in produzione
        if (SERVER_CONFIG.isProduction) {
            // Implementa verifica firma
        }

        await donationService.saveDonation({
            email: data.email,
            amount: data.amount,
            currency: data.currency || 'EUR',
            message: data.message,
            from_name: data.from_name,
            transaction_id: data.transaction_id,
            is_test: false
        });

        res.status(200).json({
            success: true,
            message: 'Webhook processato con successo'
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Webhook Error:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel processare il webhook'
        });
    }
});

export default router;