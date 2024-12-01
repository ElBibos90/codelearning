// src/scripts/listUsers.js
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

async function listUsers() {
  try {
    const query = 'SELECT id, email, password FROM users ORDER BY id';
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('No users found in database');
      return;
    }
    
    console.log('Users in database:');
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}`);
    });
    
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await pool.end();
  }
}

// Execute the function
try {
  await listUsers();
} catch (error) {
  console.error(error);
  process.exit(1);
}