import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const initDatabase = async () => {
    try {
        // Crea la tabella users per prima
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP WITH TIME ZONE
            );

            -- Poi crea user_preferences
            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                notification_email BOOLEAN DEFAULT true,
                preferred_difficulty VARCHAR(20) DEFAULT 'beginner',
                theme VARCHAR(20) DEFAULT 'light',
                language VARCHAR(10) DEFAULT 'it',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Poi user_profiles
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Tabella corsi
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
                duration_hours INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Tabella lezioni
            CREATE TABLE IF NOT EXISTS lessons (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                order_number INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(course_id, order_number)
            );

            -- Tabella iscrizioni
            CREATE TABLE IF NOT EXISTS course_enrollments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP,
                UNIQUE(user_id, course_id)
            );

            -- Tabella progresso lezioni
            CREATE TABLE IF NOT EXISTS lesson_progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, lesson_id)
            );

            -- Tabella commenti
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                parent_id INTEGER REFERENCES comments(id) ON DELETE SET NULL,
                is_deleted BOOLEAN DEFAULT FALSE
            );

            -- Tabella donazioni
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

            -- Indici
            CREATE INDEX IF NOT EXISTS idx_comments_lesson_id ON comments(lesson_id);
            CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
            CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
            CREATE INDEX IF NOT EXISTS idx_donations_timestamp ON donations(timestamp);
            CREATE INDEX IF NOT EXISTS idx_donations_is_test ON donations(is_test);
        `);

        console.log('Database inizializzato con successo');
    } catch (error) {
        console.error('Errore durante l\'inizializzazione del database:', error);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
};

initDatabase();