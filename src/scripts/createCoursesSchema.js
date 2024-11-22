import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const createTables = async () => {
    try {
        // Tabella corsi (già esistente, usiamo IF NOT EXISTS)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
                duration_hours INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Tabella courses verificata/creata');

        // Tabella lezioni
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lessons (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                order_number INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(course_id, order_number)
            );
        `);
        console.log('Tabella lessons creata');

        // Tabella iscrizioni ai corsi
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_enrollments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP,
                UNIQUE(user_id, course_id)
            );
        `);
        console.log('Tabella course_enrollments creata');

        // Tabella progresso lezioni
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lesson_progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, lesson_id)
            );
        `);
        console.log('Tabella lesson_progress creata');

        console.log('Tutte le tabelle sono state create con successo!');
    } catch (err) {
        console.error('Errore durante la creazione delle tabelle:', err);
    } finally {
        await pool.end();
    }
};

createTables();