// tests/pagination.test.js
import request from 'supertest';
import app from '../src/server.js';
import { pool } from '../src/config/database.js';
import { generateToken } from '../src/middleware/auth.js';
import { encodeCursor, decodeCursor } from '../src/utils/pagination.js';

let testUser;
let testToken;
const TEST_COURSES = 15;

beforeAll(async () => {
    // Crea utente di test
    const userResult = await pool.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Test User', 'test@example.com', 'password123', 'user')
        RETURNING id, email, role
    `);
    testUser = userResult.rows[0];
    testToken = generateToken(testUser);

    // Crea corsi di test
    for (let i = 0; i < TEST_COURSES; i++) {
        await pool.query(`
            INSERT INTO courses (title, description, difficulty_level)
            VALUES ($1, $2, $3)
        `, [
            `Test Course ${i + 1}`,
            `Description ${i + 1}`,
            ['beginner', 'intermediate', 'advanced'][i % 3]
        ]);
    }
});

describe('Pagination Tests', () => {
    test('should return first page of courses with next cursor', async () => {
        const response = await request(app)
            .get('/api/courses?limit=5')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(5);
        expect(response.body.pagination.nextCursor).toBeDefined();
        expect(response.body.pagination.hasMore).toBe(true);
    });

    test('should return next page using cursor', async () => {
        const firstResponse = await request(app)
            .get('/api/courses?limit=5')
            .set('Authorization', `Bearer ${testToken}`);

        const nextResponse = await request(app)
            .get(`/api/courses?cursor=${firstResponse.body.pagination.nextCursor}&limit=5`)
            .set('Authorization', `Bearer ${testToken}`);

        expect(nextResponse.status).toBe(200);
        expect(nextResponse.body.data).toHaveLength(5);
        expect(nextResponse.body.data[0].id).toBeGreaterThan(
            firstResponse.body.data[firstResponse.body.data.length - 1].id
        );
    });

    test('should handle last page correctly', async () => {
        const response = await request(app)
            .get('/api/courses?limit=20')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(20);
        expect(response.body.pagination.hasMore).toBe(false);
        expect(response.body.pagination.nextCursor).toBeNull();
    });
});

afterAll(async () => {
    await pool.query('DELETE FROM courses');
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await pool.end();
});