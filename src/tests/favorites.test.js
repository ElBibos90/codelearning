import request from 'supertest';
import app from '../server.js';
import { pool } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

let testUser;
let testCourse;
let testToken;

beforeAll(async () => {
    // Crea un utente di test
    const userResult = await pool.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Test User', 'test@example.com', 'password123', 'user')
        RETURNING id, email, role
    `);
    testUser = userResult.rows[0];
    testToken = generateToken(testUser);

    // Crea un corso di test
    const courseResult = await pool.query(`
        INSERT INTO courses (title, description, difficulty_level)
        VALUES ('Test Course', 'Test Description', 'beginner')
        RETURNING id
    `);
    testCourse = courseResult.rows[0];
});

describe('Favorites API', () => {
    test('Should add a course to favorites', async () => {
        const response = await request(app)
            .post(`/api/favorites/${testCourse.id}`)
            .set('Authorization', `Bearer ${testToken}`)
            .send({ notes: 'Test note' });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
    });

    test('Should prevent duplicate favorites', async () => {
        const response = await request(app)
            .post(`/api/favorites/${testCourse.id}`)
            .set('Authorization', `Bearer ${testToken}`)
            .send({ notes: 'Test note' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Corso già nei preferiti');
    });

    test('Should get user favorites', async () => {
        const response = await request(app)
            .get('/api/favorites')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].course_id).toBe(testCourse.id);
    });

    test('Should remove from favorites', async () => {
        const response = await request(app)
            .delete(`/api/favorites/${testCourse.id}`)
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});

afterAll(async () => {
    // Pulizia del database di test
    await pool.query('DELETE FROM course_favorites WHERE user_id = $1', [testUser.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await pool.query('DELETE FROM courses WHERE id = $1', [testCourse.id]);
    await pool.end();
});