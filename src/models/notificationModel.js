import { pool } from '../config/database.js';

export const notificationModel = {
    name: 'notification',

    async create(notificationData) {
        const { 
            user_id, 
            type, 
            title, 
            message, 
            data = {},
            priority = 'normal' 
        } = notificationData;

        const query = {
            text: `
                INSERT INTO notifications (
                    user_id,
                    type,
                    title,
                    message,
                    data,
                    priority,
                    created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
                RETURNING *
            `,
            values: [user_id, type, title, message, data, priority]
        };

        const result = await pool.query(query);
        return result.rows[0];
    },

    async findById(id) {
        const query = {
            text: 'SELECT * FROM notifications WHERE id = $1',
            values: [id]
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async getUserNotifications(userId, options = {}) {
        const {
            limit = 10,
            offset = 0,
            unreadOnly = false,
            type = null
        } = options;

        const values = [userId, limit, offset];
        let query = `
            SELECT *
            FROM notifications
            WHERE user_id = $1
        `;

        if (unreadOnly) {
            query += ' AND read_at IS NULL';
        }

        if (type) {
            values.push(type);
            query += ` AND type = $${values.length}`;
        }

        query += ` 
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await pool.query(query, values);
        return result.rows;
    },

    async markAsRead(notificationId, userId) {
        const query = {
            text: `
                UPDATE notifications
                SET read_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND user_id = $2
                RETURNING *
            `,
            values: [notificationId, userId]
        };

        const result = await pool.query(query);
        return result.rows[0];
    },

    async markAllAsRead(userId) {
        const query = {
            text: `
                UPDATE notifications
                SET read_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND read_at IS NULL
                RETURNING *
            `,
            values: [userId]
        };

        const result = await pool.query(query);
        return result.rows;
    },

    async delete(id, userId) {
        const query = {
            text: `
                DELETE FROM notifications
                WHERE id = $1 AND user_id = $2
                RETURNING id
            `,
            values: [id, userId]
        };

        const result = await pool.query(query);
        return result.rows[0];
    },

    async deleteAllRead(userId) {
        const query = {
            text: `
                DELETE FROM notifications
                WHERE user_id = $1 AND read_at IS NOT NULL
                RETURNING id
            `,
            values: [userId]
        };

        const result = await pool.query(query);
        return result.rows;
    },

    async getUnreadCount(userId) {
        const query = {
            text: `
                SELECT COUNT(*) as count
                FROM notifications
                WHERE user_id = $1 AND read_at IS NULL
            `,
            values: [userId]
        };

        const result = await pool.query(query);
        return parseInt(result.rows[0].count);
    },

    async getUserPreferences(userId) {
        const query = {
            text: `
                SELECT notification_email, notification_preferences
                FROM user_preferences
                WHERE user_id = $1
            `,
            values: [userId]
        };

        const result = await pool.query(query);
        return result.rows[0];
    }
};