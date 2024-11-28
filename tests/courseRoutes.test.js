import request from 'supertest';
import app from '../src/server.js';
import { pool } from '../src/config/database.js';
import { generateToken } from '../src/middleware/auth.js';
import { redisClient } from '../src/config/redis.js';

let testUser;
let testAdmin;
let testToken;
let adminToken;
let testCourse;

beforeAll(async () => {
    // Crea utente di test
    const userResult = await pool.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Test User', 'test@example.com', 'password123', 'user')
        RETURNING id, email, role;
    `);
    testUser = userResult.rows[0];
    testToken = generateToken(testUser);

    // Crea admin di test
    const adminResult = await pool.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Test Admin', 'admin@example.com', 'password123', 'admin')
        RETURNING id, email, role;
    `);
    testAdmin = adminResult.rows[0];
    adminToken = generateToken(testAdmin);
});

describe('Course Management', () => {
    test('should create a new course', async () => {
        const response = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Test Course',
                description: 'Test Description',
                difficulty_level: 'beginner',
                duration_hours: 10
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        testCourse = response.body.data;
    });

    test('should prevent non-admin from creating course', async () => {
        const response = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: 'Test Course',
                description: 'Test Description',
                difficulty_level: 'beginner',
                duration_hours: 10
            });

        expect(response.status).toBe(403);
    });

    test('should get course list', async () => {
        const response = await request(app)
            .get('/api/courses')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should get course details', async () => {
        if (!testCourse) {
            throw new Error('Test course not created');
        }

        const response = await request(app)
            .get(`/api/courses/${testCourse.id}`)
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(testCourse.id);
    });

    test('should update course', async () => {
        if (!testCourse) {
            throw new Error('Test course not created');
        }

        const response = await request(app)
            .put(`/api/courses/${testCourse.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Updated Course Title'
            });

        expect(response.status).toBe(200);
        expect(response.body.data.title).toBe('Updated Course Title');
    });

    test('should delete course', async () => {
        if (!testCourse) {
            throw new Error('Test course not created');
        }

        const response = await request(app)
            .delete(`/api/courses/${testCourse.id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
    });

    test('should handle invalid course ID', async () => {
        const response = await request(app)
            .get('/api/courses/99999')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(404);
    });
});

describe('Course Cache', () => {
    beforeEach(async () => {
        await redisClient.flushAll();
    });

    test('should cache course list', async () => {
        // Prima richiesta - hit database
        const firstResponse = await request(app)
            .get('/api/courses')
            .set('Authorization', `Bearer ${testToken}`);

        // Seconda richiesta - should use cache
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
    await pool.query('DELETE FROM users WHERE id = $1', [testAdmin.id]);
    await redisClient.quit();
    await pool.end();
});