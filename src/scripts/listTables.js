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