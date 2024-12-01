// src/scripts/createUser.js
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import { DB_CONFIG } from '../config/environments.js';

const pool = new Pool({
  user: DB_CONFIG.user,
  host: DB_CONFIG.host,
  database: DB_CONFIG.database,
  password: DB_CONFIG.password,
  port: DB_CONFIG.port
});

async function createUser(name, email, password, role = 'user') {
  try {
    // Generate salt e hash della password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Query per inserire il nuovo utente
    const query = `
      INSERT INTO users (name, email, password, role, created_at) 
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING id, name, email, role, created_at
    `;
    const values = [name, email, hashedPassword, role];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length > 0) {
      console.log('Utente creato con successo:');
      console.log('ID:', result.rows[0].id);
      console.log('Nome:', result.rows[0].name);
      console.log('Email:', result.rows[0].email);
      console.log('Ruolo:', result.rows[0].role);
      console.log('Data creazione:', result.rows[0].created_at);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Errore durante la creazione dell\'utente:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Dati del nuovo utente
const userData = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'Admin123!',  // Assicurati di usare una password più sicura in produzione
  role: 'admin'
};

// Esegui la funzione
try {
  await createUser(
    userData.name,
    userData.email,
    userData.password,
    userData.role
  );
} catch (error) {
  console.error(error);
  process.exit(1);
}