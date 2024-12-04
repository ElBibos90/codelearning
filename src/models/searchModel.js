import { pool } from '../config/database.js';

export const searchModel = {
    name: 'search',

    async searchCourses(query, options = {}) {
        const {
            limit = 10,
            offset = 0,
            difficulty = null,
            sortBy = 'rank'
        } = options;

        const values = [query];
        let paramCount = 1;

        let sql = `
            SELECT 
                c.*,
                ts_rank(search_vector, plainto_tsquery('italian', $1)) as rank,
                COUNT(*) OVER() as total_count
            FROM courses c
            WHERE search_vector @@ plainto_tsquery('italian', $1)
        `;

        if (difficulty) {
            paramCount++;
            sql += ` AND difficulty_level = $${paramCount}`;
            values.push(difficulty);
        }

        sql += ` ORDER BY ${sortBy === 'rank' ? 'rank DESC' : 'created_at DESC'}
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        
        values.push(limit, offset);

        const result = await pool.query(sql, values);
        return {
            results: result.rows,
            totalCount: result.rows[0]?.total_count || 0
        };
    },

    async searchLessons(query, options = {}) {
        const {
            limit = 10,
            offset = 0,
            courseId = null,
            sortBy = 'rank'
        } = options;

        const values = [query];
        let paramCount = 1;

        let sql = `
            SELECT 
                l.*,
                c.title as course_title,
                ts_rank(l.search_vector, plainto_tsquery('italian', $1)) as rank,
                COUNT(*) OVER() as total_count
            FROM lessons l
            JOIN courses c ON c.id = l.course_id
            WHERE l.search_vector @@ plainto_tsquery('italian', $1)
        `;

        if (courseId) {
            paramCount++;
            sql += ` AND l.course_id = $${paramCount}`;
            values.push(courseId);
        }

        sql += ` ORDER BY ${sortBy === 'rank' ? 'rank DESC' : 'l.created_at DESC'}
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        
        values.push(limit, offset);

        const result = await pool.query(sql, values);
        return {
            results: result.rows,
            totalCount: result.rows[0]?.total_count || 0
        };
    },

    async getSuggestions(query, type = 'all') {
        const values = [query];
        let sql = '';

        if (type === 'all' || type === 'courses') {
            sql += `
                SELECT DISTINCT 
                    title,
                    'course' as type
                FROM courses 
                WHERE search_vector @@ plainto_tsquery('italian', $1)
                LIMIT 5
            `;
        }

        if (type === 'all' || type === 'lessons') {
            if (sql) sql += ' UNION ALL ';
            sql += `
                SELECT DISTINCT 
                    title,
                    'lesson' as type
                FROM lessons 
                WHERE search_vector @@ plainto_tsquery('italian', $1)
                LIMIT 5
            `;
        }

        const result = await pool.query(sql, values);
        return result.rows;
    }
};