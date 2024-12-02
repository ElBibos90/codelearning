import express from 'express';
import { metrics } from '../utils/monitoring/metrics.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { register } from 'prom-client';
import { SERVER_CONFIG } from '../config/environments.js';


const router = express.Router();

router.get('/metrics', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Aggiungiamo metriche aggiuntive solo se non siamo in test
        if (!SERVER_CONFIG.isTest) {
            // Aggiorna le metriche del sistema prima di rispondere
            metrics.updateMemoryMetrics();
            metrics.updateCpuMetrics();
        }

        const metricsData = await metrics.getMetrics();
        res.set('Content-Type', register.contentType);
        res.end(metricsData);
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error fetching metrics:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle metriche',
            error: error.message
        });
    }
});

router.get('/health', async (req, res) => {
    try {
        const health = {
            uptime: process.uptime(),
            status: 'UP',
            timestamp: new Date(),
            memory: {
                total: process.memoryUsage().heapTotal,
                used: process.memoryUsage().heapUsed,
                external: process.memoryUsage().external
            },
            cpu: {
                usage: process.cpuUsage(),
                load: process.loadavg()
            },
            env: SERVER_CONFIG.nodeEnv
        };

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error checking health:', error);
        }
        res.status(503).json({
            success: false,
            message: 'Servizio non disponibile',
            error: error.message
        });
    }
});

router.get('/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const systemStatus = {
            app: {
                version: SERVER_CONFIG.version || '1.0.0', // Aggiungiamo version in SERVER_CONFIG
                nodeVersion: process.version, // Questo è corretto lasciarlo così perché è una proprietà di Node.js
                platform: process.platform,
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                environment: SERVER_CONFIG.nodeEnv
            },
            process: {
                pid: process.pid,
                ppid: process.ppid,
                title: process.title,
                argv: process.argv,
                execPath: process.execPath
            },
            os: {
                hostname: require('os').hostname(),
                type: require('os').type(),
                release: require('os').release(),
                cpus: require('os').cpus().length,
                totalMemory: require('os').totalmem(),
                freeMemory: require('os').freemem()
            }
        };

        res.json({
            success: true,
            data: systemStatus
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error fetching system status:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero dello stato del sistema',
            error: error.message
        });
    }
});

router.get('/alerts', authenticateToken, isAdmin, async (req, res) => {
    try {
        const memoryThreshold = 0.8; // 80% del totale
        const totalMemory = require('os').totalmem();
        const freeMemory = require('os').freemem();
        const memoryUsage = (totalMemory - freeMemory) / totalMemory;

        const alerts = [];

        if (memoryUsage > memoryThreshold) {
            alerts.push({
                level: 'warning',
                message: 'Alto utilizzo della memoria',
                value: `${(memoryUsage * 100).toFixed(2)}%`,
                timestamp: new Date()
            });
        }

        const loadAvg = require('os').loadavg();
        const cpuCount = require('os').cpus().length;
        const loadPerCore = loadAvg[0] / cpuCount;

        if (loadPerCore > 0.8) {
            alerts.push({
                level: 'warning',
                message: 'Alto carico della CPU',
                value: loadPerCore.toFixed(2),
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            data: {
                alerts,
                total: alerts.length,
                timestamp: new Date()
            }
        });
    } catch (error) {
        if (!SERVER_CONFIG.isTest) {
            console.error('Error checking alerts:', error);
        }
        res.status(500).json({
            success: false,
            message: 'Errore nel controllo degli alert',
            error: error.message
        });
    }
});

export default router;