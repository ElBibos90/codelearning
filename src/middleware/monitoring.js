// src/middleware/monitoring.js
import { metrics } from '../utils/monitoring/metrics.js';

export const monitorRequest = (req, res, next) => {
    const end = metrics.startTimer(req.method, req.path);
    
    res.on('finish', () => {
        end(res.statusCode);
        metrics.updateMemoryMetrics();
        metrics.updateCpuMetrics();
    });
    
    next();
};