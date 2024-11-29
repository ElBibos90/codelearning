// src/utils/monitoring/metrics.js
import { performance, PerformanceObserver } from 'perf_hooks';
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Configura le metriche di Prometheus
const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

const memoryUsage = new Gauge({
    name: 'node_memory_usage_bytes',
    help: 'Node.js memory usage'
});

const cpuUsage = new Gauge({
    name: 'node_cpu_usage_percent',
    help: 'Node.js CPU usage'
});

// Observer per le performance
const obs = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
        const labels = JSON.parse(entry.name);
        httpRequestDuration.observe(labels, entry.duration / 1000);
    });
});
obs.observe({ entryTypes: ['measure'] });

export const metrics = {
    startTimer: (method, route) => {
        const start = performance.now();
        return (statusCode) => {
            const duration = performance.now() - start;
            const labels = { method, route, status_code: statusCode };
            performance.measure(JSON.stringify(labels), { start, duration });
            httpRequestTotal.inc(labels);
        };
    },

    updateMemoryMetrics: () => {
        const used = process.memoryUsage();
        memoryUsage.set(used.heapUsed);
    },

    updateCpuMetrics: () => {
        const startUsage = process.cpuUsage();
        setTimeout(() => {
            const endUsage = process.cpuUsage(startUsage);
            const userPercent = (endUsage.user / 1000000);
            const systemPercent = (endUsage.system / 1000000);
            cpuUsage.set(userPercent + systemPercent);
        }, 100);
    },

    getMetrics: async () => {
        return register.metrics();
    }
};