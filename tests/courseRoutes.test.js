// tests/courseRoutes.test.js
import request from 'supertest';
import app from '../src/server.js';
import { pool } from '../src/config/database.js';
import { generateToken } from '../src/middleware/auth.js';
import { redisClient } from '../src/config/redis.js';

let testUser;
let testToken;

beforeAll(async () => {
    // Crea utente di test
    const userResult = await pool.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Test User', 'test@example.com', 'password123', 'user')
        RETURNING id, email, role;
    `);
    testUser = userResult.rows[0];
    testToken = generateToken(testUser);

    // Crea corso di test
    await pool.query(`
        INSERT INTO courses (title, description, difficulty_level, duration_hours)
        VALUES ('Test Course', 'Test Description', 'beginner', 10)
    `);
});

describe('Course Routes Cache', () => {
    beforeEach(async () => {
        await redisClient.flushAll(); // pulisce la cache prima di ogni test
    });

    test('should cache course list', async () => {
        // Prima richiesta - dovrebbe hit il database
        const firstResponse = await request(app)
            .get('/api/courses')
            .set('Authorization', `Bearer ${testToken}`);

        expect(firstResponse.status).toBe(200);
        expect(firstResponse.body.success).toBe(true);

        // Seconda richiesta - dovrebbe usare la cache
        const secondResponse = await request(app)
            .get('/api/courses')
            .set('Authorization', `Bearer ${testToken}`);

        expect(secondResponse.status).toBe(200);
        expect(secondResponse.body).toEqual(firstResponse.body);
    });
});

afterAll(async () => {
    await pool.query('DELETE FROM courses');
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await redisClient.quit();
    await pool.end();
});