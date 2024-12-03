import { pool } from '../config/database.js';

export const enrollmentModel = {
    name: 'enrollment',

    async create(enrollmentData) {
        const { userId, courseId } = enrollmentData;
        const query = {
            text: `
                INSERT INTO course_enrollments (user_id, course_id, enrolled_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                RETURNING *
            `,
            values: [userId, courseId]
        };

        const result = await pool.query(query);
        return result.rows[0];
    },

    async findById(id) {
        const query = {
            text: `
                SELECT 
                    ce.*,
                    c.title as course_title,
                    c.difficulty_level,
                    u.name as user_name,
                    u.email as user_email
                FROM course_enrollments ce
                JOIN courses c ON c.id = ce.course_id
                JOIN users u ON u.id = ce.user_id
                WHERE ce.id = $1
            `,
            values: [id]
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async findByUserAndCourse(userId, courseId) {
        const query = {
            text: 'SELECT * FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
            values: [userId, courseId]
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async getUserEnrollments(userId) {
        const query = {
            text: `
                SELECT 
                    ce.*,
                    c.title as course_title,
                    c.description as course_description,
                    c.difficulty_level,
                    COUNT(DISTINCT l.id) as total_lessons,
                    COUNT(DISTINCT CASE WHEN lp.completed THEN lp.lesson_id END) as completed_lessons
                FROM course_enrollments ce
                JOIN courses c ON c.id = ce.course_id
                LEFT JOIN lessons l ON l.course_id = c.id
                LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ce.user_id
                WHERE ce.user_id = $1
                GROUP BY ce.id, c.id
                ORDER BY ce.enrolled_at DESC
            `,
            values: [userId]
        };
        const result = await pool.query(query);
        return result.rows;
    },

    async getCourseEnrollments(courseId) {
        const query = {
            text: `
                SELECT 
                    ce.*,
                    u.name as user_name,
                    u.email as user_email,
                    COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.completed) as completed_lessons,
                    COUNT(DISTINCT l.id) as total_lessons
                FROM course_enrollments ce
                JOIN users u ON u.id = ce.user_id
                LEFT JOIN lessons l ON l.course_id = ce.course_id
                LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ce.user_id
                WHERE ce.course_id = $1
                GROUP BY ce.id, u.id
                ORDER BY ce.enrolled_at DESC
            `,
            values: [courseId]
        };
        const result = await pool.query(query);
        return result.rows;
    },

    async updateProgress(enrollmentId, data) {
        const { completed, completed_at } = data;
        const query = {
            text: `
                UPDATE course_enrollments
                SET 
                    completed = $1,
                    completed_at = $2
                WHERE id = $3
                RETURNING *
            `,
            values: [completed, completed_at, enrollmentId]
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async delete(id) {
        const query = {
            text: 'DELETE FROM course_enrollments WHERE id = $1 RETURNING id',
            values: [id]
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async getEnrollmentStats(courseId) {
        const query = {
            text: `
                WITH enrollment_stats AS (
                    SELECT 
                        COUNT(*) as total_enrollments,
                        COUNT(CASE WHEN completed THEN 1 END) as completed_enrollments,
                        AVG(EXTRACT(EPOCH FROM (completed_at - enrolled_at))/86400.0) 
                            FILTER (WHERE completed) as avg_completion_days
                    FROM course_enrollments
                    WHERE course_id = $1
                )
                SELECT
                    es.*,
                    ROUND((es.completed_enrollments::float / 
                          NULLIF(es.total_enrollments, 0) * 100)::numeric, 2) as completion_rate
                FROM enrollment_stats es
            `,
            values: [courseId]
        };
        const result = await pool.query(query);
        return result.rows[0];
    }
};