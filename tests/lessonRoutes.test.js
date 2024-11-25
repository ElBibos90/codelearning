import request from 'supertest';
import app from '../src/server.js';
import { pool } from '../src/config/database.js';
import { generateToken } from '../src/middleware/auth.js';

let testUser;
let testToken;
let testCourse;
let testLesson;

beforeAll(async () => {
    try {
        console.log('Setting up test data...');
        
        // Crea un utente di test
        const userResult = await pool.query(`
            INSERT INTO users (name, email, password, role)
            VALUES ('Test User', 'test@example.com', 'password123', 'admin')
            RETURNING id, email, role;
        `);
        testUser = userResult.rows[0];
        testToken = generateToken(testUser);
        console.log('Created test user:', testUser);

        // Crea un corso di test
        const courseResult = await pool.query(`
            INSERT INTO courses (title, description, difficulty_level, duration_hours)
            VALUES ('Test Course', 'Test Description', 'intermediate', 10)
            RETURNING id;
        `);
        testCourse = courseResult.rows[0];
        console.log('Created test course:', testCourse);

        // Crea un'iscrizione al corso per l'utente di test
        await pool.query(`
            INSERT INTO course_enrollments (user_id, course_id)
            VALUES ($1, $2)
        `, [testUser.id, testCourse.id]);
        console.log('Created course enrollment');

    } catch (error) {
        console.error('Setup error:', error);
        throw error;
    }
});

describe('Lesson Routes Tests', () => {
    test('Should create a new lesson with theory template', async () => {
        const response = await request(app)
            .post('/api/lessons')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                courseId: testCourse.id,
                title: 'Test Lesson',
                content: 'Test lesson content',
                orderNumber: 1,
                templateType: 'theory',
                contentFormat: 'markdown',
                metaDescription: 'Test description',
                estimatedMinutes: 30,
                status: 'draft'
            });
    
        // Aggiungo log dettagliato dell'errore
        if (response.status !== 201) {
            console.log('Test Failure Details:');
            console.log('Status:', response.status);
            console.log('Response:', response.body);
        }
    
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe('Test Lesson');
        testLesson = response.body.data;
    });

    test('Should update lesson status', async () => {
        if (!testLesson) {
            console.log('Skipping update test as no lesson was created');
            return;
        }

        const response = await request(app)
            .put(`/api/lessons/${testLesson.id}/status`)
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                status: 'review'
            });

        if (response.status !== 200) {
            console.log('Response error:', response.body);
        }

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('status', 'review');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('last_edited_at');
    });

    test('Should get lesson details', async () => {
        if (!testLesson) {
            console.log('Test lesson data:', testLesson);
            console.log('Skip get details test as no lesson was created');
            return;
        }
    
        console.log('Getting lesson details for:', {
            lessonId: testLesson.id,
            userId: testUser.id,
            courseId: testCourse.id
        });
    
        const response = await request(app)
            .get(`/api/lessons/${testLesson.id}/detail`)
            .set('Authorization', `Bearer ${testToken}`);
    
        if (response.status !== 200) {
            console.log('Get Lesson Details Failed:');
            console.log('Status:', response.status);
            console.log('Response Body:', response.body);
            console.log('Full Response:', response);
        }
    
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe('Test Lesson');
    });
});

afterAll(async () => {
    try {
        // Pulizia dei dati di test in ordine inverso di dipendenza
        if (testLesson) {
            await pool.query('DELETE FROM lessons WHERE id = $1', [testLesson.id]);
        }
        if (testCourse) {
            await pool.query('DELETE FROM courses WHERE id = $1', [testCourse.id]);
        }
        if (testUser) {
            await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    } finally {
        await pool.end();
    }
});