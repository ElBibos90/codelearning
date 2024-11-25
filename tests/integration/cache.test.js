// tests/integration/cache.test.js
import request from 'supertest';
import app from '../../src/server.js';
import { pool } from '../../src/config/database.js';
import { generateToken } from '../../src/middleware/auth.js';
import { redisClient } from '../../src/config/redis.js';

let testUser;
let testAdmin;
let testToken;
let adminToken;
let testCourse;
let testLesson;

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

    // Crea corso di test
    const courseResult = await pool.query(`
        INSERT INTO courses (title, description, difficulty_level, duration_hours)
        VALUES ('Test Course', 'Test Description', 'beginner', 10)
        RETURNING id;
    `);
    testCourse = courseResult.rows[0];

    // Crea lezione di test
    const lessonResult = await pool.query(`
        INSERT INTO lessons (course_id, title, content, order_number)
        VALUES ($1, 'Test Lesson', 'Test Content', 1)
        RETURNING id;
    `, [testCourse.id]);
    testLesson = lessonResult.rows[0];

    // Crea iscrizione al corso
    await pool.query(`
        INSERT INTO course_enrollments (user_id, course_id)
        VALUES ($1, $2)
    `, [testUser.id, testCourse.id]);
});

beforeEach(async () => {
    await redisClient.flushAll();
});

describe('Cache Integration Tests', () => {
    describe('Course Detail Cache', () => {
        it('should cache course detail response', async () => {
            // Prima richiesta - dovrebbe hit il database
            const firstResponse = await request(app)
                .get(`/api/courses/${testCourse.id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(firstResponse.status).toBe(200);

            // Seconda richiesta - dovrebbe usare la cache
            const secondResponse = await request(app)
                .get(`/api/courses/${testCourse.id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(secondResponse.status).toBe(200);
            expect(secondResponse.body).toEqual(firstResponse.body);
        });
    });

    describe('Lesson Detail Cache', () => {
        it('should cache lesson detail response', async () => {
            // Prima richiesta
            const firstResponse = await request(app)
                .get(`/api/lessons/${testLesson.id}/detail`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(firstResponse.status).toBe(200);

            // Seconda richiesta
            const secondResponse = await request(app)
                .get(`/api/lessons/${testLesson.id}/detail`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(secondResponse.status).toBe(200);
            expect(secondResponse.body).toEqual(firstResponse.body);
        });
    });

    describe('Dashboard Overview Cache', () => {
        it('should cache dashboard overview response', async () => {
            const firstResponse = await request(app)
                .get('/api/dashboard/overview')
                .set('Authorization', `Bearer ${testToken}`);

            if (firstResponse.status !== 200) {
                console.log('Dashboard Overview Error:', firstResponse.body);
            }

            expect(firstResponse.status).toBe(200);
            const secondResponse = await request(app)
                .get('/api/dashboard/overview')
                .set('Authorization', `Bearer ${testToken}`);

            expect(secondResponse.status).toBe(200);
            expect(secondResponse.body).toEqual(firstResponse.body);
        });
    });

    describe('Course Stats Cache', () => {
        it('should cache course stats response', async () => {
            const firstResponse = await request(app)
                .get(`/api/stats/course/${testCourse.id}`)
                .set('Authorization', `Bearer ${testToken}`);

            if (firstResponse.status !== 200) {
                console.log('Course Stats Error:', firstResponse.body);
            }

            expect(firstResponse.status).toBe(200);
            const secondResponse = await request(app)
                .get(`/api/stats/course/${testCourse.id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(secondResponse.status).toBe(200);
            expect(secondResponse.body).toEqual(firstResponse.body);
        });
    });

    describe('Profile Cache', () => {
        it('should cache profile response', async () => {
            const firstResponse = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${testToken}`);

            if (firstResponse.status !== 200) {
                console.log('Profile Error:', firstResponse.body);
            }

            expect(firstResponse.status).toBe(200);
            const secondResponse = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${testToken}`);

            expect(secondResponse.status).toBe(200);
            expect(secondResponse.body).toEqual(firstResponse.body);
        });
    });

    describe('Admin Overview Cache', () => {
        it('should cache admin overview response', async () => {
            const firstResponse = await request(app)
                .get('/api/stats/admin/overview')
                .set('Authorization', `Bearer ${adminToken}`);

            if (firstResponse.status !== 200) {
                console.log('Admin Overview Error:', firstResponse.body);
            }

            expect(firstResponse.status).toBe(200);
            const secondResponse = await request(app)
                .get('/api/stats/admin/overview')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(secondResponse.status).toBe(200);
            expect(secondResponse.body).toEqual(firstResponse.body);
        });
    });

    describe('My Courses Cache', () => {
        it('should cache my courses response', async () => {
            const firstResponse = await request(app)
                .get('/api/enrollments/my-courses')
                .set('Authorization', `Bearer ${testToken}`);

            if (firstResponse.status !== 200) {
                console.log('My Courses Error:', firstResponse.body);
            }

            expect(firstResponse.status).toBe(200);
            const secondResponse = await request(app)
                .get('/api/enrollments/my-courses')
                .set('Authorization', `Bearer ${testToken}`);

            expect(secondResponse.status).toBe(200);
            expect(secondResponse.body).toEqual(firstResponse.body);
        });
    });
});

afterAll(async () => {
    // Pulizia
    await pool.query('DELETE FROM lesson_progress');
    await pool.query('DELETE FROM course_enrollments');
    await pool.query('DELETE FROM lessons');
    await pool.query('DELETE FROM courses');
    await pool.query('DELETE FROM users');
    await redisClient.quit();
    await pool.end();
});