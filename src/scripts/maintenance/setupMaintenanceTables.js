import { pool } from '../../config/database.js';
import colors from 'colors';

async function setupMaintenanceTables() {
    try {
        console.log('Creazione tabelle di manutenzione...'.cyan);

        await pool.query(`
            -- Tabella per i log di salute del sistema
            CREATE TABLE IF NOT EXISTS health_checks (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                report JSONB NOT NULL,
                status VARCHAR(50) NOT NULL,
                duration INTEGER  -- in milliseconds
            );

            -- Tabella per i log di manutenzione
            CREATE TABLE IF NOT EXISTS maintenance_logs (
                id SERIAL PRIMARY KEY,
                job_name VARCHAR(50) NOT NULL,
                success BOOLEAN NOT NULL,
                duration DECIMAL,
                error_message TEXT,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                details JSONB
            );

            -- Indici
            CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks(timestamp);
            CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status);
            CREATE INDEX IF NOT EXISTS idx_maintenance_logs_job_name ON maintenance_logs(job_name);
            CREATE INDEX IF NOT EXISTS idx_maintenance_logs_executed_at ON maintenance_logs(executed_at);
        `);

        console.log('✓ Tabelle di manutenzione create con successo'.green);
    } catch (error) {
        console.error('Errore durante la creazione delle tabelle:'.red, error);
        throw error;
    } finally {
        await pool.end();
    }
}

setupMaintenanceTables()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));