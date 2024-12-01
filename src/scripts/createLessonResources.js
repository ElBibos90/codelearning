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

const createLessonResourcesTable = async () => {
    try {
        // Crea prima un tipo enum per i tipi di risorsa
        await pool.query(`
            DO $$ BEGIN
                CREATE TYPE resource_type AS ENUM ('pdf', 'video', 'link', 'code');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Crea la tabella lesson_resources
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lesson_resources (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                description TEXT,
                type resource_type DEFAULT 'link',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_lesson
                    FOREIGN KEY(lesson_id) 
                    REFERENCES lessons(id)
                    ON DELETE CASCADE
            );

            -- Indice per migliorare le performance delle query
            CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson_id 
            ON lesson_resources(lesson_id);
        `);

        // Aggiunge la colonna video_url alla tabella lessons se non esiste
        await pool.query(`
            ALTER TABLE lessons
            ADD COLUMN IF NOT EXISTS video_url TEXT;
        `);

        // Crea la tabella lesson_progress se non esiste
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lesson_progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP,
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, lesson_id)
            );

            CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson 
            ON lesson_progress(user_id, lesson_id);
        `);

        console.log('Tabelle create con successo');
        process.exit(0);
    } catch (error) {
        console.error('Errore durante la creazione delle tabelle:', error);
        process.exit(1);
    }
};

createLessonResourcesTable();