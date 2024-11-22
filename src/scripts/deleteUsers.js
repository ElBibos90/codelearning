// src/scripts/deleteUsers.js
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function deleteAllUsers() {
  try {
    const query = 'DELETE FROM users';
    await pool.query(query);
    console.log('Tutti gli utenti sono stati eliminati con successo');
  } catch (error) {
    console.error('Errore durante l\'eliminazione degli utenti:', error);
  } finally {
    await pool.end();
  }
}

// Esegui la funzione
try {
  await deleteAllUsers();
} catch (error) {
  console.error(error);
  process.exit(1);
}