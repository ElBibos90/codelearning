// src/scripts/updatePassword.js
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const pool = new Pool({
  user: DB_CONFIG.user,
  host: DB_CONFIG.host,
  database: DB_CONFIG.database,
  password: DB_CONFIG.password,
  port: DB_CONFIG.port
});

async function updateUserPassword(userId, newPassword) {
  try {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user password
    const query = 'UPDATE users SET password = $1 WHERE id = $2 RETURNING *';
    const values = [hashedPassword, userId];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      console.log('User not found');
      return null;
    }
    
    console.log('Password updated successfully');
    return result.rows[0];
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  } finally {
    // Close the pool connection
    await pool.end();
  }
}

// Execute the function
const userId = 2; // ID del primo utente
const newPassword = 'nuova-password-sicura';

try {
  await updateUserPassword(userId, newPassword);
} catch (error) {
  console.error(error);
  process.exit(1);
}