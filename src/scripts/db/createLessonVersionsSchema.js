// src/scripts/db/createLessonVersionsSchema.js
import { pool } from '../../config/database.js';

async function createLessonVersionsSchema() {
    try {
        // Inizia una transazione
        await pool.query('BEGIN');

        // Crea la tabella per le versioni
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lesson_versions (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                content_format VARCHAR(10) DEFAULT 'markdown',
                version INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER REFERENCES users(id),
                change_description TEXT,
                UNIQUE(lesson_id, version)
            );

            -- Crea gli indici
            CREATE INDEX IF NOT EXISTS idx_lesson_versions_lesson_id ON lesson_versions(lesson_id);
            CREATE INDEX IF NOT EXISTS idx_lesson_versions_version ON lesson_versions(version);
            
            -- Aggiungi colonne alla tabella lessons se non esistono
            ALTER TABLE lessons
            ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS content_format VARCHAR(10) DEFAULT 'markdown',
            ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS last_edited_by INTEGER REFERENCES users(id);
        `);

        await pool.query('COMMIT');
        console.log('✓ Schema lesson_versions creato con successo');

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Errore durante la creazione dello schema:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Esegui la migrazione
createLessonVersionsSchema().catch(console.error);