import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const listTables = async () => {
    try {
        const result = await pool.query(`
            SELECT 
                table_name,
                (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        console.log('\nTabelle nel database:');
        console.log('-------------------');
        result.rows.forEach(table => {
            console.log(`${table.table_name} (${table.column_count} colonne)`);
        });
        
    } catch (error) {
        console.error('Errore:', error);
    } finally {
        await pool.end();
    }
};

listTables();