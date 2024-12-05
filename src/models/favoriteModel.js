import { pool } from '../config/database.js';

export const favoriteModel = {
    name: 'favorite',

    async create(favoriteData) {
        const { userId, courseId, notes = null } = favoriteData;
        const query = {
            text: `
                INSERT INTO course_favorites (
                    user_id,
                    course_id,
                    notes,
                    created_at
                ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                RETURNING *
            `,
            values: [userId, courseId, notes]
        };

        const result = await pool.query(query);
        return result.rows[0];
    },

    async findById(id) {
        const query = {
            text: `
                SELECT 
                    cf.*,
                    c.title as course_title,
                    c.description as course_description,
                    c.difficulty_level,
                    u.name as user_name,
                    u.email as user_email
                FROM course_favorites cf
                JOIN courses c ON c.id = cf.course_id
                JOIN users u ON u.id = cf.user_id
                WHERE cf.id = $1
            `,
            values: [id]
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async findByUserAndCourse(userId, courseId) {
        const query = {
            text: 'SELECT * FROM course_favorites WHERE user_id = $1 AND course_id = $2',
            values: [userId, courseId]
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async getUserFavorites(userId) {
        const query = {
            text: `
                SELECT 
                    cf.*,
                    c.title as course_title,
                    c.description as course_description,
                    c.difficulty_level,
                    COUNT(DISTINCT l.id) as total_lessons,
                    COUNT(DISTINCT ce.id) filter (where ce.user_id = $1) as is_enrolled
                FROM course_favorites cf
                JOIN courses c ON c.id = cf.course_id
                LEFT JOIN lessons l ON l.course_id = c.id
                LEFT JOIN course_enrollments ce ON ce.course_id = c.id AND ce.user_id = $1
                WHERE cf.user_id = $1
                GROUP BY cf.id, c.id
                ORDER BY cf.created_at DESC
            `,
            values: [userId]
        };
        const result = await pool.query(query);
        return result.rows;
    },

    async delete(userId, courseId) {
        const query = {
            text: `
                DELETE FROM course_favorites 
                WHERE user_id = $1 AND course_id = $2
                RETURNING *
            `,
            values: [userId, courseId]
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async update(id, data) {
        const { notes } = data;
        const query = {
            text: `
                UPDATE course_favorites 
                SET notes = $1
                WHERE id = $2
                RETURNING *
            `,
            values: [notes, id]
        };
        const result = await pool.query(query);
        return result.rows[0];
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
    },

    async getFavoriteStats(courseId) {
        const query = {
            text: `
                WITH stats AS (
                    SELECT 
                        c.id,
                        COUNT(DISTINCT cf.user_id) as total_favorites,
                        COUNT(DISTINCT CASE WHEN cf.notes IS NOT NULL THEN cf.user_id END) as with_notes,
                        COUNT(DISTINCT ce.id) as enrolled_favorites
                    FROM courses c
                    LEFT JOIN course_favorites cf ON cf.course_id = c.id
                    LEFT JOIN course_enrollments ce ON ce.course_id = c.id 
                        AND ce.user_id = cf.user_id
                    WHERE c.id = $1
                    GROUP BY c.id
                )
                SELECT 
                    COALESCE(total_favorites, 0) as total_favorites,
                    COALESCE(with_notes, 0) as with_notes,
                    COALESCE(enrolled_favorites, 0) as enrolled_favorites
                FROM stats
            `,
            values: [courseId]
        };
    
        const result = await pool.query(query);
        return result.rows[0] || {
            total_favorites: 0,
            with_notes: 0,
            enrolled_favorites: 0
        };
    }
};