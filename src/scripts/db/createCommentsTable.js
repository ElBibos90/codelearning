import { pool } from '../../config/database.js';

async function createCommentsTable() {
    try {
        // Crea la tabella comments con tutti i campi necessari
        await pool.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                parent_id INTEGER DEFAULT NULL,
                is_deleted BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
            );

            -- Indici per migliorare le performance
            CREATE INDEX IF NOT EXISTS idx_comments_lesson_id ON comments(lesson_id);
            CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
            CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
        `);

        console.log('✓ Comments table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating comments table:', error);
        process.exit(1);
    }
}

createCommentsTable();