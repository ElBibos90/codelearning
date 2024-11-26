// src/scripts/db/applyIndexes.js
import { pool } from '../../config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyIndexes() {
    try {
        // Modifico il percorso per puntare alla cartella migrations in root
        const sqlPath = path.join(__dirname, '../../../migrations', '20241126_add_indexes.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');
        
        console.log('Applying indexes...');
        await pool.query(sql);
        console.log('Indexes applied successfully');
    } catch (error) {
        console.error('Error applying indexes:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

applyIndexes().catch(console.error);