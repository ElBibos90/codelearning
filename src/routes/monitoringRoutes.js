// src/routes/monitoringRoutes.js
import express from 'express';
import { metrics } from '../utils/monitoring/metrics.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { register } from 'prom-client';

const router = express.Router();

router.get('/metrics', authenticateToken, isAdmin, async (req, res) => {
    try {
        const metricsData = await metrics.getMetrics();
        res.set('Content-Type', register.contentType);
        res.end(metricsData);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

export default router;