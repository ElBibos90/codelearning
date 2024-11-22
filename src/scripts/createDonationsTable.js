// src/scripts/createDonationsTable.js
import { pool } from '../config/database.js';

const createDonationsTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        message TEXT,
        from_name VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        is_test BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Indici per migliorare le performance delle query
      CREATE INDEX IF NOT EXISTS idx_donations_timestamp ON donations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_donations_is_test ON donations(is_test);
    `;

    await pool.query(query);
    console.log('Tabella donations creata con successo');
  } catch (error) {
    console.error('Errore durante la creazione della tabella donations:', error);
  } finally {
    pool.end();
  }
};

createDonationsTable();