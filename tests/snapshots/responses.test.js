import request from 'supertest';
import app from '../../src/server.js';
import { pool } from '../../src/config/database.js';
import { generateToken } from '../../src/middleware/auth.js';

let testUser;
let testToken;

beforeAll(async () => {
    const userResult = await pool.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Test User', 'test@example.com', 'password123', 'user')
        RETURNING id, email, role;
    `);
    testUser = userResult.rows[0];
    testToken = generateToken(testUser);

    // Create test course
    await pool.query(`
        INSERT INTO courses (title, description, difficulty_level, duration_hours)
        VALUES ('Test Course', 'Test Description', 'beginner', 10)
    `);
});

describe('API Response Snapshots', () => {
    test('GET /api/courses should match snapshot', async () => {
        const response = await request(app)
            .get('/api/courses')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchSnapshot({
            data: expect.any(Array),
            pagination: expect.any(Object)
        });
    });

    test('Error response should match snapshot', async () => {
        const response = await request(app)
            .get('/api/courses/99999')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toMatchSnapshot();
    });

    test('Validation error should match snapshot', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test',
                email: 'invalid-email',
                password: '123'
            });

        expect(response.status).toBe(400);
        expect(response.body).toMatchSnapshot();
    });

    test('Success response should match snapshot', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(response.status).toBe(200);
        expect(response.body).toMatchSnapshot({
            token: expect.any(String)
        });
    });
});

afterAll(async () => {
    await pool.query('DELETE FROM courses');
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await pool.end();
});