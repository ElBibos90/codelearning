import pkg from 'pg';
import colors from 'colors';
import path from 'path';
import { fileURLToPath } from 'url';
import { DB_CONFIG, SERVER_CONFIG } from '../../config/environments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Pool } = pkg;

const mainPool = new Pool({
    user: DB_CONFIG.user,
    host: DB_CONFIG.host,
    database: 'postgres',
    password: DB_CONFIG.password,
    port: DB_CONFIG.port,
});

async function setupTestDatabase() {
    let testPool;
    try {
        console.log('Inizializzazione database di test...'.cyan);
        const client = await mainPool.connect();
        
        try {
            // Verifica se il database esiste
            const dbCheck = await client.query(
                "SELECT 1 FROM pg_database WHERE datname = $1",
                [DB_CONFIG.database]
            );

            if (dbCheck.rows.length === 0) {
                console.log('Creazione database di test...'.yellow);
                // Termina connessioni esistenti
                await client.query(`
                    SELECT pg_terminate_backend(pg_stat_activity.pid)
                    FROM pg_stat_activity
                    WHERE pg_stat_activity.datname = $1
                    AND pid <> pg_backend_pid();
                `, [DB_CONFIG.database]);
                
                await client.query(`CREATE DATABASE ${DB_CONFIG.database}`);
                console.log(`✓ Database ${DB_CONFIG.database} creato`.green);
            } else {
                console.log('Database di test già esistente'.yellow);
            }

            await client.release();
            await mainPool.end();

            // Connessione al database di test
            testPool = new Pool({
                user: DB_CONFIG.user,
                host: DB_CONFIG.host,
                database: DB_CONFIG.database,
                password: DB_CONFIG.password,
                port: DB_CONFIG.port,
            });

            // ... resto del codice rimane invariato ...
            // [Il resto del file rimane lo stesso, continua con la creazione delle tabelle]

        } catch (err) {
            console.error('Errore durante la creazione del database:'.red, err);
            throw err;
        }
    } catch (error) {
        console.error('Errore durante il setup:'.red, error);
        throw error;
    } finally {
        if (testPool) {
            await testPool.end();
        }
    }
}

setupTestDatabase()
    .then(() => {
        console.log('✓ Setup database di test completato con successo'.green);
        process.exit(0);
    })
    .catch((error) => {
        console.error('✗ Setup database di test fallito'.red, error);
        process.exit(1);
    });