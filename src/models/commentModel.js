import { pool } from '../config/database.js';

export const commentModel = {
    name: 'comment',

    async create(commentData) {
        const { lessonId, userId, content, parentId = null } = commentData;
        const query = {
            text: `
                INSERT INTO comments (
                    lesson_id,
                    user_id, 
                    content,
                    parent_id,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *
            `,
            values: [lessonId, userId, content, parentId]
        };

        const result = await pool.query(query);
        return result.rows[0];
    },

    async findById(id) {
        const query = {
            text: `
                SELECT 
                    c.*,
                    u.name as user_name,
                    u.email as user_email,
                    p.id as parent_comment_id,
                    p.content as parent_content,
                    pu.name as parent_user_name
                FROM comments c
                JOIN users u ON u.id = c.user_id
                LEFT JOIN comments p ON p.id = c.parent_id
                LEFT JOIN users pu ON pu.id = p.user_id
                WHERE c.id = $1 AND c.is_deleted = FALSE
            `,
            values: [id]
        };
        
        const result = await pool.query(query);
        return result.rows[0];
    },

    async update(id, data) {
        const { content } = data;
        const query = {
            text: `
                UPDATE comments 
                SET 
                    content = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2 AND is_deleted = FALSE
                RETURNING *
            `,
            values: [content, id]
        };

        const result = await pool.query(query);
        return result.rows[0];
    },

    async delete(id) {
        const query = {
            text: `
                UPDATE comments
                SET is_deleted = TRUE
                WHERE id = $1
                RETURNING id
            `,
            values: [id]
        };

        const result = await pool.query(query);
        return result.rows[0];
    },

    async getLessonComments(lessonId) {
        const query = {
            text: `
                WITH RECURSIVE comment_tree AS (
                    -- Base comments (no parent)
                    SELECT 
                        c.*,
                        u.name as user_name,
                        u.email as user_email,
                        0 as level,
                        ARRAY[c.id] as path
                    FROM comments c
                    JOIN users u ON u.id = c.user_id
                    WHERE c.lesson_id = $1 
                    AND c.parent_id IS NULL
                    AND c.is_deleted = FALSE

                    UNION ALL

                    -- Recursive part for replies
                    SELECT 
                        c.*,
                        u.name as user_name,
                        u.email as user_email,
                        ct.level + 1,
                        ct.path || c.id
                    FROM comments c
                    JOIN users u ON u.id = c.user_id
                    JOIN comment_tree ct ON c.parent_id = ct.id
                    WHERE c.is_deleted = FALSE
                )
                SELECT *
                FROM comment_tree
                ORDER BY path, created_at DESC
            `,
            values: [lessonId]
        };

        const result = await pool.query(query);
        return result.rows;
    },

    async getUserComments(userId) {
        const query = {
            text: `
                SELECT 
                    c.*,
                    l.title as lesson_title,
                    co.title as course_title
                FROM comments c
                JOIN lessons l ON l.id = c.lesson_id
                JOIN courses co ON co.id = l.course_id
                WHERE c.user_id = $1 AND c.is_deleted = FALSE
                ORDER BY c.created_at DESC
            `,
            values: [userId]
        };

        const result = await pool.query(query);
        return result.rows;
    },

    async getReplies(commentId) {
        const query = {
            text: `
                SELECT 
                    c.*,
                    u.name as user_name,
                    u.email as user_email
                FROM comments c
                JOIN users u ON u.id = c.user_id
                WHERE c.parent_id = $1 AND c.is_deleted = FALSE
                ORDER BY c.created_at ASC
            `,
            values: [commentId]
        };

        const result = await pool.query(query);
        return result.rows;
    },

    async checkOwnership(commentId, userId) {
        const query = {
            text: `
                SELECT EXISTS(
                    SELECT 1 
                    FROM comments 
                    WHERE id = $1 AND user_id = $2
                ) as is_owner
            `,
            values: [commentId, userId]
        };

        const result = await pool.query(query);
        return result.rows[0].is_owner;
    }
};