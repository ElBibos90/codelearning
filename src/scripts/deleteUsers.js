// src/scripts/deleteUsers.js
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