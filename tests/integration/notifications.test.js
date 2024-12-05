import request from 'supertest';
import app from '../../src/server.js';
import { pool } from '../../src/config/database.js';
import { generateToken } from '../../src/middleware/auth.js';
import { redisClient } from '../../src/config/redis.js';
import bcrypt from 'bcryptjs';

let testUser;
let testToken;
let testNotification;

beforeAll(async () => {
    try {
        // Prima creiamo le tabelle necessarie
        await pool.query(`
            -- Crea type se non esiste
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'notification_priority'
                ) THEN
                    CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
                END IF;
            END $$;

            -- Tabella notifiche
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                data JSONB DEFAULT '{}',
                priority notification_priority DEFAULT 'normal',
                read_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT notifications_type_check CHECK (
                    type IN ('system', 'course_update', 'lesson_completed', 'achievement', 'comment', 'enrollment')
                )
            );

            -- Preferenze utente
            ALTER TABLE user_preferences
            ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
                "system": true,
                "course_update": true,
                "lesson_completed": true,
                "achievement": true,
                "comment": true,
                "enrollment": true
            }'::jsonb;
        `);

        // Crea utente di test
        const hashedPassword = await bcrypt.hash('password123', 10);
        const userResult = await pool.query(`
            INSERT INTO users (name, email, password, role)
            VALUES ('Test User', 'test@example.com', $1, 'user')
            RETURNING id, email, role
        `, [hashedPassword]);
        testUser = userResult.rows[0];
        testToken = generateToken(testUser);

        // Crea preferenze utente
        await pool.query(`
            INSERT INTO user_preferences (
                user_id, 
                notification_email,
                notification_preferences
            )
            VALUES ($1, true, $2)
        `, [
            testUser.id,
            JSON.stringify({ 
                system: true,
                course_update: true,
                lesson_completed: true,
                achievement: true,
                comment: true,
                enrollment: true
            })
        ]);

        // Crea una notifica di test
        const notificationResult = await pool.query(`
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                priority
            )
            VALUES ($1, 'system', 'Test Notification', 'Test message', 'normal')
            RETURNING *
        `, [testUser.id]);
        testNotification = notificationResult.rows[0];

    } catch (error) {
        console.error('Setup error:', error);
        throw error;
    }
});

describe('Notification Routes', () => {
    test('should get user notifications', async () => {
        const response = await request(app)
            .get('/api/notifications')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.unreadCount).toBeDefined();
    });

    test('should mark notification as read', async () => {
        const response = await request(app)
            .put(`/api/notifications/${testNotification.id}/read`)
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.read_at).toBeDefined();
    });

    test('should mark all notifications as read', async () => {
        // Prima creiamo altre notifiche non lette
        await pool.query(`
            INSERT INTO notifications (user_id, type, title, message)
            VALUES 
                ($1, 'system', 'Test 1', 'Message 1'),
                ($1, 'system', 'Test 2', 'Message 2')
        `, [testUser.id]);

        const response = await request(app)
            .put('/api/notifications/read-all')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.every(n => n.read_at)).toBe(true);
    });

    test('should delete notification', async () => {
        const response = await request(app)
            .delete(`/api/notifications/${testNotification.id}`)
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should delete all read notifications', async () => {
        const response = await request(app)
            .delete('/api/notifications/read/all')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    test('should handle invalid notification id', async () => {
        const response = await request(app)
            .put('/api/notifications/99999/read')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test('should handle unauthorized access', async () => {
        const response = await request(app)
            .get('/api/notifications');

        expect(response.status).toBe(401);
    });
});

afterAll(async () => {
    try {
        // Pulizia dati di test
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [testUser.id]);
        await pool.query('DELETE FROM user_preferences WHERE user_id = $1', [testUser.id]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    } catch (error) {
        console.error('Cleanup error:', error);
    } finally {
        await redisClient.quit();
        await pool.end();
    }
});