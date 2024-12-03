import request from 'supertest';
import app from '../src/server.js';
import { pool } from '../src/config/database.js';
import bcrypt from 'bcryptjs';

describe('Authentication Routes', () => {
    let testUser;

    beforeAll(async () => {
        const hashedPassword = await bcrypt.hash('TestPass123', 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, email',
            ['Test User', 'test@example.com', hashedPassword]
        );
        testUser = result.rows[0];
    });

    test('should register new user', async () => {
        const newUser = {
            name: 'New User',
            email: 'new@example.com',
            password: 'TestPass123'  // Password che rispetta i requisiti della validazione modificata
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(newUser);

        if (response.status !== 201) {
            console.log('Registration failed:', response.body);
        }

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
    });

    test('should login existing user', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'TestPass123'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    test('should reject invalid email format', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Invalid User',
                email: 'invalid-email',
                password: 'TestPass123'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test('should reject weak passwords', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Weak User',
                email: 'weak@example.com',
                password: '123'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test('should prevent duplicate email registration', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Duplicate User',
                email: 'test@example.com',
                password: 'TestPass123'
            });
    
        expect(response.status).toBe(422);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    afterAll(async () => {
        await pool.query('DELETE FROM users WHERE email IN ($1, $2)', 
            ['test@example.com', 'new@example.com']
        );
        await pool.end();
    });
});