import pkg from 'pg';
import dotenv from 'dotenv';
import colors from 'colors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Pool } = pkg;

// Carica l'env corretto
dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });

const mainPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function setupTestDatabase() {
    let testPool;
    try {
        console.log('Inizializzazione database di test...'.cyan);
        const client = await mainPool.connect();
        
        try {
            // Verifica se il database esiste
            const dbCheck = await client.query(
                "SELECT 1 FROM pg_database WHERE datname = 'codelearning_test'"
            );

            if (dbCheck.rows.length === 0) {
                console.log('Creazione database di test...'.yellow);
                // Termina connessioni esistenti
                await client.query(`
                    SELECT pg_terminate_backend(pg_stat_activity.pid)
                    FROM pg_stat_activity
                    WHERE pg_stat_activity.datname = 'codelearning_test'
                    AND pid <> pg_backend_pid();
                `);
                
                await client.query('CREATE DATABASE codelearning_test');
                console.log('✓ Database codelearning_test creato'.green);
            } else {
                console.log('Database di test già esistente'.yellow);
            }

            await client.release();
            await mainPool.end();

            // Connessione al database di test
            testPool = new Pool({
                user: process.env.DB_USER,
                host: process.env.DB_HOST,
                database: 'codelearning_test',
                password: process.env.DB_PASSWORD,
                port: process.env.DB_PORT,
            });

            console.log('Creazione schema del database...'.yellow);
            
            // Creazione schema
            await testPool.query(`
                -- Elimina tabelle esistenti
                DROP TABLE IF EXISTS lesson_progress CASCADE;
                DROP TABLE IF EXISTS lesson_versions CASCADE;
                DROP TABLE IF EXISTS lesson_resources CASCADE;
                DROP TABLE IF EXISTS comments CASCADE;
                DROP TABLE IF EXISTS course_favorites CASCADE;
                DROP TABLE IF EXISTS lessons CASCADE;
                DROP TABLE IF EXISTS course_enrollments CASCADE;
                DROP TABLE IF EXISTS courses CASCADE;
                DROP TABLE IF EXISTS user_preferences CASCADE;
                DROP TABLE IF EXISTS user_profiles CASCADE;
                DROP TABLE IF EXISTS users CASCADE;
                DROP TABLE IF EXISTS maintenance_logs CASCADE;

                -- Crea tipo enum per stati lezione
                DO $$ BEGIN
                    CREATE TYPE lesson_status AS ENUM ('draft', 'review', 'published', 'archived');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;

                -- Crea le tabelle
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP WITH TIME ZONE
                );

                CREATE TABLE courses (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
                    duration_hours INTEGER,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE lessons (
                    id SERIAL PRIMARY KEY,
                    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    content TEXT,
                    content_format VARCHAR(10) DEFAULT 'markdown',
                    order_number INTEGER NOT NULL,
                    video_url TEXT,
                    status lesson_status DEFAULT 'draft',
                    version INTEGER DEFAULT 1,
                    last_edited_by INTEGER REFERENCES users(id),
                    last_edited_at TIMESTAMP WITH TIME ZONE,
                    meta_description TEXT,
                    estimated_minutes INTEGER DEFAULT 30,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    published_at TIMESTAMP WITH TIME ZONE,
                    UNIQUE(course_id, order_number)
                );

                CREATE TABLE IF NOT EXISTS user_profiles (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                full_name VARCHAR(255),
                bio TEXT,
                avatar_url TEXT,
                linkedin_url TEXT,
                github_url TEXT,
                website_url TEXT,
                skills TEXT[],
                interests TEXT[],
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                notification_email BOOLEAN DEFAULT true,
                preferred_difficulty VARCHAR(20) DEFAULT 'beginner',
                theme VARCHAR(20) DEFAULT 'light',
                language VARCHAR(10) DEFAULT 'it',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

                CREATE TABLE course_enrollments (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    completed BOOLEAN DEFAULT FALSE,
                    completed_at TIMESTAMP WITH TIME ZONE,
                    UNIQUE(user_id, course_id)
                );

                CREATE TABLE lesson_progress (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                    completed BOOLEAN DEFAULT FALSE,
                    completed_at TIMESTAMP WITH TIME ZONE,
                    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, lesson_id)
                );

                CREATE TABLE lesson_resources (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    url TEXT NOT NULL,
                    description TEXT,
                    type VARCHAR(20) CHECK (type IN ('pdf', 'link', 'code', 'github')),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

    CREATE TABLE IF NOT EXISTS course_favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        UNIQUE(user_id, course_id)
    );

                CREATE TABLE maintenance_logs (
                    id SERIAL PRIMARY KEY,
                    job_name VARCHAR(50) NOT NULL,
                    success BOOLEAN NOT NULL,
                    duration DECIMAL,
                    error_message TEXT,
                    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    details JSONB
                );

                -- Crea gli indici
                CREATE INDEX idx_lessons_course_id ON lessons(course_id);
                CREATE INDEX idx_lessons_status ON lessons(status);
                CREATE INDEX idx_enrollments_user ON course_enrollments(user_id);
                CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
                CREATE INDEX idx_lesson_progress_user_lesson ON lesson_progress(user_id, lesson_id);
                CREATE INDEX idx_lesson_resources_lesson ON lesson_resources(lesson_id);
                CREATE INDEX idx_course_favorites_user ON course_favorites(user_id);
                CREATE INDEX idx_course_favorites_course ON course_favorites(course_id);
                CREATE INDEX idx_maintenance_logs_job_name ON maintenance_logs(job_name);
            `);

            console.log('✓ Schema creato con successo'.green);

        } catch (err) {
            console.error('Errore durante la creazione del database:'.red, err);
            throw err;
        }
    } catch (error) {
        console.error('Errore durante il setup:'.red, error);
        throw error;
    } finally {
        if (testPool) {
            await testPool.end();
        }
    }
}

setupTestDatabase()
    .then(() => {
        console.log('✓ Setup database di test completato con successo'.green);
        process.exit(0);
    })
    .catch((error) => {
        console.error('✗ Setup database di test fallito'.red, error);
        process.exit(1);
    });