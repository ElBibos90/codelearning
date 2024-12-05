import { pool } from '../config/database.js';
import { SERVER_CONFIG } from '../config/environments.js';

export const searchModel = {
    name: 'search',

    async searchCourses(query, options = {}) {
        try {
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
                    ts_rank(c.search_vector, plainto_tsquery('italian', $1)) as rank,
                    COUNT(*) OVER() as total_count
                FROM courses c
                WHERE c.search_vector @@ plainto_tsquery('italian', $1)
            `;

            if (difficulty) {
                paramCount++;
                sql += ` AND c.difficulty_level = $${paramCount}`;
                values.push(difficulty);
            }

            sql += ` ORDER BY ${sortBy === 'rank' ? 'rank DESC' : 'created_at DESC'}
                    LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            
            values.push(limit, offset);

            if (!SERVER_CONFIG.isTest) {
                console.log('Executing query:', sql);
                console.log('With values:', values);
            }

            const result = await pool.query(sql, values);
            
            return {
                results: result.rows,
                totalCount: result.rows[0]?.total_count || 0
            };
        } catch (error) {
            if (!SERVER_CONFIG.isTest) {
                console.error('Search query error:', error);
            }
            throw error;
        }
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
    
        //console.log('Executing query:', sql); // DEBUG
        //console.log('With values:', values); // DEBUG
    
        const result = await pool.query(sql, values);
        //console.log('Query results:', result.rows); // DEBUG
        return result.rows;
    }
};