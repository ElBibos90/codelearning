import { pool } from '../config/database.js';

export const favoriteModel = {
    async addFavorite(userId, courseId, notes = null) {
        const query = {
            text: `
                INSERT INTO course_favorites (user_id, course_id, notes)
                VALUES ($1, $2, $3)
                RETURNING id, created_at
            `,
            values: [userId, courseId, notes]
        };
        
        try {
            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Corso già nei preferiti');
            }
            throw error;
        }
    },

    async removeFavorite(userId, courseId) {
        const query = {
            text: `
                DELETE FROM course_favorites
                WHERE user_id = $1 AND course_id = $2
                RETURNING id
            `,
            values: [userId, courseId]
        };
        
        const result = await pool.query(query);
        if (result.rowCount === 0) {
            throw new Error('Preferito non trovato');
        }
        return result.rows[0];
    },

    async getUserFavorites(userId) {
        const query = {
            text: `
                SELECT 
                    cf.id,
                    cf.course_id,
                    cf.created_at,
                    cf.notes,
                    c.title,
                    c.description,
                    c.difficulty_level,
                    COUNT(DISTINCT l.id) as total_lessons
                FROM course_favorites cf
                JOIN courses c ON c.id = cf.course_id
                LEFT JOIN lessons l ON l.course_id = c.id
                WHERE cf.user_id = $1
                GROUP BY cf.id, c.id
                ORDER BY cf.created_at DESC
            `,
            values: [userId]
        };
        
        const result = await pool.query(query);
        return result.rows;
    },

    async isFavorite(userId, courseId) {
        const query = {
            text: `
                SELECT EXISTS (
                    SELECT 1 FROM course_favorites
                    WHERE user_id = $1 AND course_id = $2
                ) as is_favorite
            `,
            values: [userId, courseId]
        };
        
        const result = await pool.query(query);
        return result.rows[0].is_favorite;
    }
};