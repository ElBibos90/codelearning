import request from 'supertest';
import app from '../src/server.js';
import { redisClient } from '../src/config/redis.js';
import { generateToken } from '../src/middleware/auth.js';
import { jest } from '@jest/globals';

describe('Test Environment', () => {
    it('should have correct test environment variables', () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.DATABASE_URL).toBeDefined();
    });

    it('should mock console.error and console.warn', () => {
        expect(global.console.error).toEqual(expect.any(Function));
        expect(global.console.warn).toEqual(expect.any(Function));
    });
});

describe('Security Middleware - Rate Limiting', () => {
    let adminToken;
    let userToken;

    beforeAll(async () => {
        adminToken = generateToken({ id: 1, email: 'admin@test.com', role: 'admin' });
        userToken = generateToken({ id: 2, email: 'user@test.com', role: 'user' });
        
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        await redisClient.flushAll();
    });

    afterAll(async () => {
        if (redisClient.isOpen) {
            await redisClient.quit();
        }
    });

    beforeEach(async () => {
        await redisClient.flushAll();
    });

    describe('Authentication Rate Limiting', () => {
        test('should limit login attempts', async () => {
            console.log('Starting rate limit test');
            const attempts = [];

            for (let i = 0; i < 10; i++) {
                attempts.push(
                    request(app)
                        .post('/api/auth/login')
                        .set('X-Forwarded-For', '192.168.1.1')
                        .send({
                            email: 'test@example.com',
                            password: 'wrong-password'
                        })
                );
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            const responses = await Promise.all(attempts);
            const rateLimited = responses.filter(r => r.status === 429);
            expect(rateLimited.length).toBeGreaterThan(0);
            
            if (rateLimited.length > 0) {
                expect(rateLimited[0].body.success).toBe(false);
                expect(rateLimited[0].body.message).toMatch(/Rate limit exceeded/);
            }
        }, 15000);

        test('should track login attempts separately by IP', async () => {
            const ips = ['192.168.1.10', '192.168.1.11', '192.168.1.12'];
            const attemptsPerIp = 3;
            
            for (const ip of ips) {
                const attempts = [];
                for (let i = 0; i < attemptsPerIp; i++) {
                    attempts.push(
                        request(app)
                            .post('/api/auth/login')
                            .set('X-Forwarded-For', ip)
                            .send({
                                email: 'test@example.com',
                                password: 'wrong-password'
                            })
                    );
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                const responses = await Promise.all(attempts);
                expect(responses.every(r => r.status !== 429)).toBe(true);
            }
        }, 15000);
    });

    describe('Admin Routes Rate Limiting', () => {
        test('should apply stricter limits to admin routes', async () => {
            const attempts = [];
            for (let i = 0; i < 10; i++) {
                attempts.push(
                    request(app)
                        .get('/api/admin/courses')
                        .set('X-Forwarded-For', '192.168.1.3')
                        .set('Authorization', `Bearer ${adminToken}`)
                );
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            const responses = await Promise.all(attempts);
            const rateLimited = responses.filter(r => r.status === 429);
            expect(rateLimited.length).toBeGreaterThan(0);
            
            if (rateLimited.length > 0) {
                expect(rateLimited[0].body.message).toMatch(/Rate limit exceeded/);
            }
        }, 15000);
    });

    describe('API Rate Limiting', () => {
        test('should apply general rate limits to API routes', async () => {
            const attempts = [];
            for (let i = 0; i < 15; i++) {
                attempts.push(
                    request(app)
                        .get('/api/courses')
                        .set('X-Forwarded-For', '192.168.1.4')
                        .set('Authorization', `Bearer ${userToken}`)
                );
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            const responses = await Promise.all(attempts);
            const rateLimited = responses.filter(r => r.status === 429);
            expect(rateLimited.length).toBeGreaterThan(0);
        }, 15000);

        test('should track rate limits separately for different routes', async () => {
            const routeAttempts = async (path, count) => {
                const attempts = [];
                for (let i = 0; i < count; i++) {
                    attempts.push(
                        request(app)
                            .get(path)
                            .set('X-Forwarded-For', '192.168.1.5')
                            .set('Authorization', `Bearer ${userToken}`)
                    );
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                return Promise.all(attempts);
            };

            const [coursesResponses, lessonsResponses] = await Promise.all([
                routeAttempts('/api/courses', 5),
                routeAttempts('/api/lessons/1', 5)
            ]);

            expect(coursesResponses.every(r => r.status !== 429)).toBe(true);
            expect(lessonsResponses.every(r => r.status !== 429)).toBe(true);
        }, 15000);
    });

    describe('IP Blacklisting', () => {
        test('should blacklist IP after repeated violations', async () => {
            const testIp = '192.168.1.6';

            // Genera violazioni per il blacklist
            for (let i = 0; i < 15; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .set('X-Forwarded-For', testIp)
                    .send({
                        email: 'test@example.com',
                        password: 'wrong-password'
                    });
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Aspetta che il blacklisting sia effettivo
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verifica che l'IP sia stato blacklistato
            const response = await request(app)
                .get('/api/courses')
                .set('X-Forwarded-For', testIp)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toMatch(/Access denied due to repeated violations/);
        }, 30000);

        test('should maintain blacklist across different routes', async () => {
            const testIp = '192.168.1.7';

            // Genera violazioni
            for (let i = 0; i < 15; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .set('X-Forwarded-For', testIp)
                    .send({
                        email: 'test@example.com',
                        password: 'wrong-password'
                    });
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Aspetta che il blacklisting sia effettivo
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verifica blacklist su route diverse
            const responses = await Promise.all([
                request(app)
                    .get('/api/courses')
                    .set('X-Forwarded-For', testIp)
                    .set('Authorization', `Bearer ${userToken}`),
                request(app)
                    .get('/api/lessons/1')
                    .set('X-Forwarded-For', testIp)
                    .set('Authorization', `Bearer ${userToken}`),
                request(app)
                    .get('/api/profile')
                    .set('X-Forwarded-For', testIp)
                    .set('Authorization', `Bearer ${userToken}`)
            ]);

            responses.forEach(response => {
                expect(response.status).toBe(403);
                expect(response.body.message).toMatch(/Access denied due to repeated violations/);
            });
        }, 30000);

        test('should track violations separately by IP', async () => {
            const ip1 = '192.168.1.8';
            const ip2 = '192.168.1.9';

            // Genera alcune violazioni per il primo IP
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .set('X-Forwarded-For', ip1)
                    .send({
                        email: 'test@example.com',
                        password: 'wrong-password'
                    });
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Verifica che il secondo IP non sia influenzato
            const response = await request(app)
                .get('/api/courses')
                .set('X-Forwarded-For', ip2)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).not.toBe(403);
        }, 15000);
    });
});