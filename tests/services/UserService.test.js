// tests/services/UserService.test.js
import { jest } from '@jest/globals';
import UserService  from '../../src/services/UserService.js';
import { pool } from '../../src/config/database';
import bcrypt from 'bcryptjs';

describe('UserService', () => {
    let testUser;
    let testToken;

    beforeAll(async () => {
        // Crea un utente di test
        const hashedPassword = await bcrypt.hash('password123', 10);
        const result = await pool.query(`
            INSERT INTO users (name, email, password, role)
            VALUES ('Test User', 'test@example.com', $1, 'user')
            RETURNING id, email, role
        `, [hashedPassword]);
        testUser = result.rows[0];
    });

    afterAll(async () => {
        // Pulizia database
        await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
        await pool.end();
    });

    describe('Authentication', () => {
        test('should successfully login user', async () => {
            const result = await UserService.login('test@example.com', 'password123');
            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            expect(result.user.email).toBe('test@example.com');
        });

        test('should fail login with wrong password', async () => {
            await expect(
                UserService.login('test@example.com', 'wrongpassword')
            ).rejects.toThrow('Invalid credentials');
        });

        test('should register new user', async () => {
            const newUser = {
                name: 'New User',
                email: 'new@example.com',
                password: 'password123'
            };

            const result = await UserService.register(newUser);
            expect(result.user).toBeDefined();
            expect(result.token).toBeDefined();
            expect(result.user.email).toBe(newUser.email);

            // Cleanup
            await pool.query('DELETE FROM users WHERE email = $1', [newUser.email]);
        });
    });

    describe('Profile Management', () => {
        test('should get full profile', async () => {
            const profile = await UserService.getFullProfile(testUser.id);
            expect(profile).toBeDefined();
            expect(profile.email).toBe(testUser.email);
        });

        test('should update profile', async () => {
            const updates = {
                name: 'Updated Name'
            };

            const result = await UserService.updateProfile(testUser.id, updates);
            expect(result.name).toBe(updates.name);
        });

        test('should update preferences', async () => {
            const preferences = {
                theme: 'dark',
                language: 'en'
            };

            const result = await UserService.updatePreferences(testUser.id, preferences);
            expect(result.theme).toBe(preferences.theme);
            expect(result.language).toBe(preferences.language);
        });
    });

    describe('Password Management', () => {
        test('should change password', async () => {
            const result = await UserService.changePassword(
                testUser.id,
                'password123',
                'newpassword123'
            );
            expect(result).toBe(true);

            // Verify can login with new password
            const loginResult = await UserService.login('test@example.com', 'newpassword123');
            expect(loginResult.user).toBeDefined();
        });

        test('should fail with incorrect current password', async () => {
            await expect(
                UserService.changePassword(testUser.id, 'wrongpassword', 'newpassword123')
            ).rejects.toThrow('Current password is incorrect');
        });
    });

    describe('Admin Functions', () => {
        let adminUser;

        beforeAll(async () => {
            // Create admin user
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const result = await pool.query(`
                INSERT INTO users (name, email, password, role)
                VALUES ('Admin User', 'admin@example.com', $1, 'admin')
                RETURNING id, email, role
            `, [hashedPassword]);
            adminUser = result.rows[0];
        });

        afterAll(async () => {
            await pool.query('DELETE FROM users WHERE email = $1', ['admin@example.com']);
        });

        test('should get all users', async () => {
            const users = await UserService.getAllUsers();
            expect(Array.isArray(users)).toBe(true);
            expect(users.length).toBeGreaterThan(0);
        });

        test('should update user role', async () => {
            const result = await UserService.updateUserRole(testUser.id, 'admin');
            expect(result.role).toBe('admin');

            // Revert role
            await UserService.updateUserRole(testUser.id, 'user');
        });
    });
});