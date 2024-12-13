// src/models/courseModel.js
import { pool } from '../config/database.js';

export const courseModel = {
    name: 'course',

    async create(courseData) {
        const { title, description, difficulty_level, duration_hours } = courseData;
        const query = {
            text: `
                INSERT INTO courses (
                    title, 
                    description, 
                    difficulty_level, 
                    duration_hours
                ) VALUES ($1, $2, $3, $4)
                RETURNING *
            `,
            values: [title, description, difficulty_level, duration_hours]
        };

        const result = await pool.query(query);
        return result.rows[0];
    },

    async findById(id) {
        const query = {
            text: 'SELECT * FROM courses WHERE id = $1',
            values: [id]
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async getWithLessons(courseId) {
        const query = {
            text: `
                SELECT 
                    c.*,
                    json_agg(
                        json_build_object(
                            'id', l.id,
                            'title', l.title,
                            'order_number', l.order_number
                        ) ORDER BY l.order_number
                    ) FILTER (WHERE l.id IS NOT NULL) as lessons
                FROM courses c
                LEFT JOIN lessons l ON l.course_id = c.id
                WHERE c.id = $1
                GROUP BY c.id
            `,
            values: [courseId]
        };
        
        const result = await pool.query(query);
        return result.rows[0];
    },

    async update(id, data) {
        const allowedFields = ['title', 'description', 'difficulty_level', 'duration_hours', 'status'];
        const updates = [];
        const values = [];
        let paramCount = 1;

        Object.keys(data).forEach(key => {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = $${paramCount}`);
                values.push(data[key]);
                paramCount++;
            }
        });

        if (updates.length === 0) return null;

        values.push(id);
        const query = {
            text: `
                UPDATE courses 
                SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $${paramCount} 
                RETURNING *
            `,
            values
        };

        const result = await pool.query(query);
        return result.rows[0];
    },

    async delete(id) {
        const query = {
            text: 'DELETE FROM courses WHERE id = $1 RETURNING id',
            values: [id]
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async search(searchQuery, options) {
        const { difficulty, page, limit, sortBy, sortOrder } = options;
        const offset = (page - 1) * limit;
        const values = [];
        let paramCount = 1;
    
        let query = `
            SELECT 
                c.*,
                COUNT(*) OVER()::integer as total_count
            FROM courses c
            WHERE 1=1
        `;
    
        if (searchQuery) {
            query += ` AND (
                title ILIKE $${paramCount} 
                OR description ILIKE $${paramCount}
            )`;
            values.push(`%${searchQuery}%`);
            paramCount++;
        }
    
        if (difficulty) {
            query += ` AND difficulty_level = $${paramCount}`;
            values.push(difficulty);
            paramCount++;
        }
    
        query += ` ORDER BY ${sortBy} ${sortOrder}
                  LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);
    
        const result = await pool.query(query, values);
        
        return {
            courses: result.rows,
            totalCount: parseInt(result.rows[0]?.total_count || 0),
            currentPage: page,
            totalPages: Math.ceil((parseInt(result.rows[0]?.total_count || 0)) / limit)
        };
    },

    async getLessonsCount(courseId) {
        try {
            console.log('Getting lessons count for course:', courseId);
            const query = {
                text: 'SELECT COUNT(*) FROM lessons WHERE course_id = $1',
                values: [courseId]
            };
            const result = await pool.query(query);
            console.log('Lessons count result:', result.rows[0]);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error getting lessons count:', error.message);
            throw error;
        }
    },

    async updateStatus(courseId, status) {
        try {
            // Prima verifica se il corso esiste
            const checkQuery = {
                text: 'SELECT id FROM courses WHERE id = $1',
                values: [courseId]
            };
            const checkResult = await pool.query(checkQuery);
            if (checkResult.rows.length === 0) {
                console.log('Course not found:', courseId);
                return null;
            }
    
            // Poi esegui l'update con una query più semplice
            const updateQuery = {
                text: `
                    UPDATE courses 
                    SET 
                        status = $1,
                        published_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2 
                    RETURNING *
                `,
                values: [status, courseId]
            };
    
            console.log('Executing update query:', updateQuery.text, updateQuery.values);
            
            const result = await pool.query(updateQuery);
            console.log('Update result:', result.rows[0]);
            
            return result.rows[0];
        } catch (error) {
            console.error('Error in updateStatus:', error.message, error.stack);
            throw error;
        }
    },

    async checkEnrollment(courseId, userId) {
        const query = {
            text: 'SELECT id FROM course_enrollments WHERE course_id = $1 AND user_id = $2',
            values: [courseId, userId]
        };
        const result = await pool.query(query);
        return result.rows.length > 0;
    },

    async createEnrollment(courseId, userId) {
        const query = {
            text: `
                INSERT INTO course_enrollments (course_id, user_id)
                VALUES ($1, $2)
                RETURNING *
            `,
            values: [courseId, userId]
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async getUserProgress(courseId, userId) {
        const query = {
            text: `
                WITH lesson_stats AS (
                    SELECT 
                        COUNT(DISTINCT l.id) as total_lessons,
                        COUNT(DISTINCT CASE WHEN lp.completed THEN l.id END) as completed_lessons
                    FROM lessons l
                    LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $2
                    WHERE l.course_id = $1
                )
                SELECT 
                    ls.*,
                    ce.enrolled_at,
                    ce.completed as course_completed,
                    ce.completed_at as course_completed_at,
                    CASE 
                        WHEN ls.total_lessons = 0 THEN 0
                        ELSE ROUND((ls.completed_lessons::float / ls.total_lessons::float) * 100)
                    END as progress_percentage
                FROM lesson_stats ls
                JOIN course_enrollments ce ON ce.course_id = $1 AND ce.user_id = $2
            `,
            values: [courseId, userId]
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async getCourseStats(courseId) {
        const query = {
            text: `
                SELECT 
                    COUNT(DISTINCT ce.user_id) as total_enrollments,
                    COUNT(DISTINCT CASE WHEN ce.completed THEN ce.user_id END) as completed_enrollments,
                    COUNT(DISTINCT l.id) as total_lessons,
                    AVG(CASE 
                        WHEN ce.completed THEN 
                            EXTRACT(EPOCH FROM (ce.completed_at - ce.enrolled_at))/86400.0 
                    END) as avg_completion_days
                FROM courses c
                LEFT JOIN course_enrollments ce ON ce.course_id = c.id
                LEFT JOIN lessons l ON l.course_id = c.id
                WHERE c.id = $1
                GROUP BY c.id
            `,
            values: [courseId]
        };
        const result = await pool.query(query);
        return result.rows[0];
    }
};