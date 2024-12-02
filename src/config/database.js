import pg from 'pg';
import { DB_CONFIG, SERVER_CONFIG } from './environments.js';

const { Pool } = pg;

export const pool = new Pool({
    user: DB_CONFIG.user,
    host: DB_CONFIG.host,
    database: DB_CONFIG.database,
    password: DB_CONFIG.password,
    port: DB_CONFIG.port
});

pool.on('connect', () => {
    if (!SERVER_CONFIG.isTest) {
        console.log('Database connesso con successo');
    }
});

pool.on('error', (err) => {
    console.error('Errore di connessione al database:', err);
});

export default pool;