import pkg from 'pg';
const { Pool } = pkg;
import { DB_CONFIG } from '../config/environments.js';

 const pool = new Pool({
         user: DB_CONFIG.user,
         host: DB_CONFIG.host,
         database: DB_CONFIG.database,
         password: DB_CONFIG.password,
         port: DB_CONFIG.port
     });

const addLastAccessedColumn = async () => {
    try {
        await pool.query(`
            ALTER TABLE lesson_progress
            ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE;

            -- Aggiorna i record esistenti impostando last_accessed uguale a created_at
            UPDATE lesson_progress
            SET last_accessed = created_at
            WHERE last_accessed IS NULL;
            
            -- Aggiungi un indice per migliorare le performance delle query
            CREATE INDEX IF NOT EXISTS idx_lesson_progress_last_accessed 
            ON lesson_progress(last_accessed);
        `);

        console.log('Colonna last_accessed aggiunta con successo');
        process.exit(0);
    } catch (error) {
        console.error('Errore durante l\'aggiunta della colonna:', error);
        process.exit(1);
    }
};

addLastAccessedColumn();