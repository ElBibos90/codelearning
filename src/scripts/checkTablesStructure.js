import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
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