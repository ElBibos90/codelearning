import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function updateLessonsSchema() {
    try {
        // Inizia una transazione
        await pool.query('BEGIN');

        // 1. Aggiungi nuove colonne alla tabella lessons
        await pool.query(`
            -- Colonne per il contenuto
            ALTER TABLE lessons
            ADD COLUMN IF NOT EXISTS content_format VARCHAR(10) DEFAULT 'markdown',
            ADD COLUMN IF NOT EXISTS content_preview TEXT,
            ADD COLUMN IF NOT EXISTS meta_description TEXT,
            ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 30;
        `);

        console.log('✓ Aggiunte colonne per il contenuto');

        // 2. Aggiungi colonne per il versioning e tracking
        await pool.query(`
            ALTER TABLE lessons
            ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS last_edited_by INTEGER REFERENCES users(id);
        `);

        console.log('✓ Aggiunte colonne per il versioning');

        // 3. Aggiungi colonne per la pubblicazione
        await pool.query(`
            ALTER TABLE lessons
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft'
                CHECK (status IN ('draft', 'review', 'published', 'archived')),
            ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
        `);

        console.log('✓ Aggiunte colonne per la pubblicazione');

        // 4. Crea gli indici
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
            CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON lessons(course_id, order_number);
        `);

        console.log('✓ Creati indici');

        // 5. Crea la tabella per le versioni
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
        `);

        console.log('✓ Creata tabella lesson_versions');

        // 6. Crea il trigger per il versioning
        await pool.query(`
            CREATE OR REPLACE FUNCTION track_lesson_versions()
            RETURNS TRIGGER AS $$
            BEGIN
                IF (TG_OP = 'UPDATE' AND OLD.content <> NEW.content) THEN
                    -- Incrementa la versione
                    NEW.version = OLD.version + 1;
                    NEW.last_edited_at = CURRENT_TIMESTAMP;
                    
                    -- Salva la nuova versione
                    INSERT INTO lesson_versions (
                        lesson_id,
                        content,
                        content_format,
                        version,
                        created_by,
                        change_description
                    ) VALUES (
                        NEW.id,
                        NEW.content,
                        NEW.content_format,
                        NEW.version,
                        NEW.last_edited_by,
                        'Aggiornamento contenuto'
                    );
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS lessons_version_tracker ON lessons;
            
            CREATE TRIGGER lessons_version_tracker
                BEFORE UPDATE ON lessons
                FOR EACH ROW
                EXECUTE FUNCTION track_lesson_versions();
        `);

        console.log('✓ Creato trigger per il versioning');

        // Commit della transazione
        await pool.query('COMMIT');
        console.log('✅ Aggiornamento schema completato con successo!');

    } catch (error) {
        // Rollback in caso di errore
        await pool.query('ROLLBACK');
        console.error('❌ Errore durante l\'aggiornamento dello schema:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Esegui la migrazione
updateLessonsSchema().catch(console.error);