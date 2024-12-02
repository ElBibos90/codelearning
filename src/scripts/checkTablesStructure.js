import pg from 'pg';
import { DB_CONFIG } from '../config/environments.js';

const { Pool } = pg;

 const pool = new Pool({
         user: DB_CONFIG.user,
         host: DB_CONFIG.host,
         database: DB_CONFIG.database,
         password: DB_CONFIG.password,
         port: DB_CONFIG.port
     });

const checkTableStructure = async () => {
    try {
        // Query per vedere la struttura della tabella lessons
        const query = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'lessons'
            ORDER BY ordinal_position;
        `;
        
        const { rows } = await pool.query(query);
        console.log('Struttura tabella lessons:');
        console.log(rows);
    } catch (error) {
        console.error('Errore:', error);
    } finally {
        await pool.end();
    }
};

checkTableStructure();