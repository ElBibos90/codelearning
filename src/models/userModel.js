// src/models/userModel.js
import { pool } from '../config/database.js';

export const userModel = {
    name: 'user',

    async findById(id) {
        const query = {
            text: 'SELECT id, name, email, role, created_at, last_login FROM users WHERE id = $1',
            values: [id],
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async findByEmail(email) {
        const query = {
            text: 'SELECT * FROM users WHERE email = $1',
            values: [email],
        };
        console.log('Executing findByEmail query for:', email);
        const result = await pool.query(query);
        console.log('Found user hash:', result.rows[0]?.password);
        return result.rows[0];
    },

    async create(userData) {
        const { name, email, password, role = 'user' } = userData;
        
        // Rimuoviamo l'hashing qui poiché viene fatto nel service
        const query = {
            text: 'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
            values: [name, email, password, role],
        };
        
        console.log('Creating user with hash:', password);
        const result = await pool.query(query);
        return result.rows[0];
    },

    async update(id, data) {
        const validFields = ['name', 'email', 'role', 'last_login', 'password'];
        const updates = [];
        const values = [];
        let paramCount = 1;

        Object.keys(data).forEach(key => {
            if (validFields.includes(key)) {
                updates.push(`${key} = $${paramCount}`);
                values.push(data[key]);
                paramCount++;
            }
        });

        if (updates.length === 0) return null;

        values.push(id);
        const query = {
            text: `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, role, created_at, last_login`,
            values
        };

        const result = await pool.query(query);
        return result.rows[0];
    },

    async updatePreferences(userId, preferences) {
        const query = {
            text: `
                INSERT INTO user_preferences (user_id, theme, language, notification_email)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id)
                DO UPDATE SET
                    theme = EXCLUDED.theme,
                    language = EXCLUDED.language,
                    notification_email = EXCLUDED.notification_email,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            `,
            values: [userId, preferences.theme, preferences.language, preferences.notification_email]
        };
    
        const result = await pool.query(query);
        return result.rows[0];
    },

    async getPasswordHash(userId) {
        const query = {
            text: 'SELECT password FROM users WHERE id = $1',
            values: [userId]
        };
        const result = await pool.query(query);
        console.log('Retrieved password hash for user:', userId, result.rows[0]?.password);
        return result.rows[0]?.password;
    },
    
    async updatePassword(userId, hashedPassword) {
        const query = {
            text: 'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
            values: [hashedPassword, userId]
        };
        console.log('Updating password with hash:', hashedPassword);
        const result = await pool.query(query);
        return result.rows[0];
    },
    
    async delete(id) {
        const query = {
            text: 'DELETE FROM users WHERE id = $1 RETURNING id',
            values: [id],
        };
        const result = await pool.query(query);
        return result.rows[0];
    },

    async findAll() {
        const query = 'SELECT id, name, email, role, created_at, last_login FROM users ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    }
};