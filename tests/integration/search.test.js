import request from 'supertest';
import app from '../../src/server.js';
import { pool } from '../../src/config/database.js';
import { generateToken } from '../../src/middleware/auth.js';
import bcrypt from 'bcryptjs';

let testUser;
let testToken;
let testCourse;
let testLesson;

beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userResult = await pool.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Test User', 'test@example.com', $1, 'user')
        RETURNING id, email, role
    `, [hashedPassword]);
    testUser = userResult.rows[0];
    testToken = generateToken(testUser);

    // Create test course
    const courseResult = await pool.query(`
        INSERT INTO courses (
            title, 
            description, 
            difficulty_level,
            duration_hours
        ) VALUES (
            'Advanced JavaScript Course',
            'Learn advanced JavaScript programming concepts',
            'advanced',
            20
        ) RETURNING *
    `);
    testCourse = courseResult.rows[0];

    // Create test lesson
    const lessonResult = await pool.query(`
        INSERT INTO lessons (
            course_id,
            title,
            content,
            meta_description,
            order_number
        ) VALUES (
            $1,
            'Closures in JavaScript',
            'Understanding closures and their practical applications',
            'Learn about closures in JavaScript',
            1
        ) RETURNING *
    `, [testCourse.id]);
    testLesson = lessonResult.rows[0];

    // Wait for search vectors to be updated
    await new Promise(resolve => setTimeout(resolve, 100));
});

describe('Search API', () => {
    test('should search across all content', async () => {
        const response = await request(app)
            .get('/api/search?q=JavaScript')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.courses).toBeDefined();
        expect(response.body.data.lessons).toBeDefined();
    });

    test('should search courses with filters', async () => {
        const response = await request(app)
            .get('/api/search/courses?q=JavaScript&difficulty=advanced')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.results.length).toBeGreaterThan(0);
    });

    test('should search lessons with course filter', async () => {
        const response = await request(app)
            .get(`/api/search/lessons?q=closures&courseId=${testCourse.id}`)
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.results.length).toBeGreaterThan(0);
    });

    test('should get search suggestions', async () => {
        const response = await request(app)
            .get('/api/search/suggestions?q=Java')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should handle empty search query', async () => {
        const response = await request(app)
            .get('/api/search/courses')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test('should require authentication', async () => {
        const response = await request(app)
            .get('/api/search?q=JavaScript');

        expect(response.status).toBe(401);
    });
});

afterAll(async () => {
    await pool.query('DELETE FROM lessons WHERE id = $1', [testLesson.id]);
    await pool.query('DELETE FROM courses WHERE id = $1', [testCourse.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await pool.end();
});