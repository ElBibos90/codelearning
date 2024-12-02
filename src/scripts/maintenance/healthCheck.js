import colors from 'colors';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';
import { SERVER_CONFIG, DB_CONFIG } from '../../config/environments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

async function checkSystemHealth(dbManager) {
    try {
        console.log('Avvio health check del sistema...\n'.cyan);
        const startTime = Date.now();

        // 1. Verifica Sistema
        console.log('Verifica Sistema:'.yellow);
        
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryUsage = (usedMem / totalMem * 100).toFixed(2);

        const systemStatus = {
            environment: SERVER_CONFIG.nodeEnv,
            cpu_load: os.loadavg()[0].toFixed(2),
            memory_usage: `${memoryUsage}%`,
            uptime: `${(os.uptime() / 3600).toFixed(2)} hours`
        };

        Object.entries(systemStatus).forEach(([key, value]) => {
            console.log(`${key}: ${value}`.cyan);
        });

        // 2. Verifica Database
        console.log('\nVerifica Database:'.yellow);

        const connectionStart = Date.now();
        await dbManager.query('SELECT 1');
        const connectionTime = Date.now() - connectionStart;
        console.log(`Tempo di risposta DB: ${connectionTime}ms`.cyan);
        console.log(`Database: ${DB_CONFIG.database}`.cyan);
        console.log(`Host: ${DB_CONFIG.host}`.cyan);

        // Statistiche database
        const dbStats = await dbManager.query(`
            SELECT 
                pg_size_pretty(pg_database_size(current_database())) as db_size,
                pg_size_pretty(pg_total_relation_size('users')) as users_size,
                pg_size_pretty(pg_total_relation_size('courses')) as courses_size,
                pg_size_pretty(pg_total_relation_size('lessons')) as lessons_size
        `);

        Object.entries(dbStats.rows[0]).forEach(([key, value]) => {
            console.log(`${key}: ${value}`.cyan);
        });

        // 3. Controllo Connessioni
        console.log('\nConnessioni Database:'.yellow);
        
        const connections = await dbManager.query(`
            SELECT 
                state, 
                COUNT(*) as count,
                MAX(NOW() - query_start) as max_duration
            FROM pg_stat_activity 
            WHERE datname = current_database()
            GROUP BY state;
        `);

        connections.rows.forEach(conn => {
            console.log(`${conn.state || 'idle'}: ${conn.count} connections`.cyan);
            if (conn.max_duration) {
                console.log(`Max Duration: ${conn.max_duration}`.cyan);
            }
        });

        // 4. Cache e Performance
        console.log('\nStatistiche Cache:'.yellow);
        
        const cacheStats = await dbManager.query(`
            SELECT 
                sum(heap_blks_read) as heap_read,
                sum(heap_blks_hit) as heap_hit,
                sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))::float as cache_hit_ratio
            FROM pg_statio_user_tables;
        `);

        const cacheRatio = (cacheStats.rows[0].cache_hit_ratio * 100).toFixed(2);
        console.log(`Cache Hit Ratio: ${cacheRatio}%`.cyan);

        // Calcolo durata totale
        const duration = Date.now() - startTime;

        // 5. Salvataggio Report
        const report = {
            timestamp: new Date(),
            system: {
                ...systemStatus,
                memory_usage: parseFloat(memoryUsage)
            },
            database: {
                connection_time: connectionTime,
                sizes: {
                    ...dbStats.rows[0]
                },
                connections: connections.rows,
                cache_hit_ratio: parseFloat(cacheRatio)
            },
            duration_ms: duration,
            environment: SERVER_CONFIG.nodeEnv
        };

        await dbManager.query(`
            INSERT INTO maintenance_logs (
                job_name,
                success,
                duration,
                details,
                executed_at
            ) VALUES (
                'system_health_check',
                true,
                $1,
                $2,
                CURRENT_TIMESTAMP
            )
        `, [duration, JSON.stringify(report)]);

        if (!SERVER_CONFIG.isTest) {
            console.log('\n✓ Health check completato con successo'.green);
            console.log(`Durata totale: ${duration}ms`.cyan);
        }

    } catch (error) {
        console.error('Errore durante health check:'.red, error);
        
        await dbManager.query(`
            INSERT INTO maintenance_logs (
                job_name,
                success,
                error_message,
                executed_at
            ) VALUES (
                'system_health_check',
                false,
                $1,
                CURRENT_TIMESTAMP
            )
        `, [error.message]);
        
        throw error;
    }
}

// Esegui se chiamato direttamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    import('../../utils/testDbManager.js').then(({ testDbManager }) => {
        checkSystemHealth(testDbManager)
            .then(() => {
                console.log('\n✓ Health check completato con successo'.green);
                process.exit(0);
            })
            .catch((error) => {
                console.error('\n✗ Health check fallito:'.red, error);
                process.exit(1);
            });
    });
}

export { checkSystemHealth };