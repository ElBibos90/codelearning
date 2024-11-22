// src/scripts/updateUsersTable.js
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function updateUsersTable() {
  try {
    // Aggiungi colonna last_login
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE
    `);

    console.log('Tabella users aggiornata con successo');
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della tabella:', error);
  } finally {
    await pool.end();
  }
}

// Esegui la funzione
try {
  await updateUsersTable();
} catch (error) {
  console.error(error);
  process.exit(1);
}