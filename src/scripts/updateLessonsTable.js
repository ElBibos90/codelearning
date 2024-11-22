// src/scripts/updateLessonsTable.js
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const updateLessonsTable = async () => {
  try {
    // Aggiungi la colonna video_url se non esiste
    await pool.query(`
      ALTER TABLE lessons 
      ADD COLUMN IF NOT EXISTS video_url TEXT;

      -- Aggiungi altri campi utili se non esistono già
      ALTER TABLE lessons 
      ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;

      -- Crea la tabella lesson_resources se non esiste
      CREATE TABLE IF NOT EXISTS lesson_resources (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        type VARCHAR(20) CHECK (type IN ('pdf', 'link', 'code', 'github')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Crea indici per migliorare le performance
      CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson_id 
      ON lesson_resources(lesson_id);
    `);

    console.log('Tabella lessons aggiornata con successo');
    process.exit(0);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della tabella:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

updateLessonsTable();