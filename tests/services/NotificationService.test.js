import { jest } from '@jest/globals';
import { pool } from '../../src/config/database.js';
import NotificationService from '../../src/services/NotificationService.js';
import { ValidationError, DatabaseError } from '../../src/utils/errors';
import bcrypt from 'bcryptjs';

describe('NotificationService', () => {
    let testUser;
    let testNotification;

    beforeAll(async () => {
        // Crea un utente di test
        const hashedPassword = await bcrypt.hash('password123', 10);
        const userResult = await pool.query(`
            INSERT INTO users (name, email, password, role)
            VALUES ('Test User', 'test@example.com', $1, 'user')
            RETURNING id, email, role
        `, [hashedPassword]);
        testUser = userResult.rows[0];

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
                course_update: true,
                lesson_completed: true,
                system: true
            })
        ]);
    });

    afterAll(async () => {
        // Pulizia database
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [testUser.id]);
        await pool.query('DELETE FROM user_preferences WHERE user_id = $1', [testUser.id]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
        await pool.end();
    });

    describe('Notification Creation', () => {
        test('should create a notification', async () => {
            const notificationData = {
                user_id: testUser.id,
                type: 'system',
                title: 'Test Notification',
                message: 'This is a test notification',
                priority: 'normal'
            };

            testNotification = await NotificationService.create(notificationData);
            expect(testNotification).toBeDefined();
            expect(testNotification.title).toBe(notificationData.title);
            expect(testNotification.user_id).toBe(testUser.id);
        });

        test('should validate notification data', async () => {
            const invalidData = {
                user_id: testUser.id,
                // missing required fields
            };

            await expect(NotificationService.create(invalidData))
                .rejects
                .toThrow(ValidationError);
        });

        test('should respect user preferences', async () => {
            // Update user preferences to disable system notifications
            await pool.query(`
                UPDATE user_preferences 
                SET notification_preferences = $1
                WHERE user_id = $2
            `, [
                JSON.stringify({ system: false }),
                testUser.id
            ]);

            const notificationData = {
                user_id: testUser.id,
                type: 'system',
                title: 'Test Notification',
                message: 'This should not be created'
            };

            const result = await NotificationService.create(notificationData);
            expect(result).toBeNull();
        });
    });

    describe('Notification Management', () => {
        test('should get user notifications', async () => {
            const notifications = await NotificationService.getUserNotifications(testUser.id);
            expect(Array.isArray(notifications)).toBe(true);
            expect(notifications.length).toBeGreaterThan(0);
        });

        test('should mark notification as read', async () => {
            const result = await NotificationService.markAsRead(
                testNotification.id,
                testUser.id
            );
            expect(result.read_at).toBeDefined();
        });

        test('should get unread count', async () => {
            const count = await NotificationService.getUnreadCount(testUser.id);
            expect(typeof count).toBe('number');
        });

        test('should mark all as read', async () => {
            // Create some unread notifications first
            await NotificationService.create({
                user_id: testUser.id,
                type: 'system',
                title: 'Test 1',
                message: 'Unread 1'
            });

            await NotificationService.create({
                user_id: testUser.id,
                type: 'system',
                title: 'Test 2',
                message: 'Unread 2'
            });

            const result = await NotificationService.markAllAsRead(testUser.id);
            expect(Array.isArray(result)).toBe(true);
            expect(result.every(n => n.read_at)).toBe(true);
        });
    });

    describe('Notification Deletion', () => {
        test('should delete a notification', async () => {
            const result = await NotificationService.delete(
                testNotification.id,
                testUser.id
            );
            expect(result).toBe(true);
        });

        test('should delete all read notifications', async () => {
            const result = await NotificationService.deleteAllRead(testUser.id);
            expect(Array.isArray(result)).toBe(true);
        });

        test('should handle non-existent notification', async () => {
            await expect(
                NotificationService.delete(99999, testUser.id)
            ).rejects.toThrow(ValidationError);
        });
    });
});