import request from 'supertest';
import app from '../../src/server.js';
import { pool } from '../../src/config/database.js';
import { generateToken } from '../../src/middleware/auth.js';
import bcrypt from 'bcryptjs';

let testUser;
let testToken;

beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const result = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, email',
        ['Test User', 'test@example.com', hashedPassword]
    );
    testUser = result.rows[0];
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
        expect(response.body).toEqual({
            success: true,
            data: expect.any(Array),
            pagination: expect.any(Object)
        });
    });

    test('Error response should match snapshot', async () => {
        const response = await request(app)
            .get('/api/courses/99999')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            message: 'Corso non trovato'
        });
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
        expect(response.body).toEqual({
            success: false,
            errors: expect.arrayContaining([
                expect.objectContaining({
                    msg: 'Email non valida',
                    path: 'email'
                }),
                expect.objectContaining({
                    msg: 'Password deve contenere almeno 8 caratteri, una lettera e un numero',
                    path: 'password'
                })
            ])
        });
    });

    test('Success response should match snapshot', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            message: expect.any(String),
            token: expect.any(String),
            user: expect.objectContaining({
                email: 'test@example.com'
            })
        });
    });
});

afterAll(async () => {
    await pool.query('DELETE FROM courses');
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await pool.end();
});