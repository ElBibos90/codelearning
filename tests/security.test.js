import request from 'supertest';
import app from '../src/server.js';
import { redisClient } from '../src/config/redis.js';
import { generateToken } from '../src/middleware/auth.js';
import { sanitizeContent } from '../src/utils/sanitize.js';
import { SERVER_CONFIG, DB_CONFIG } from '../src/config/environments.js';

let testUser;
let testAdmin;
let testToken;
let adminToken;

describe('Test Environment', () => {
    it('should have correct test environment variables', () => {
        expect(SERVER_CONFIG.isTest).toBe(true);
        expect(DB_CONFIG.url).toBeDefined();
    });

    it('should mock console.error and console.warn', () => {
        expect(global.console.error).toEqual(expect.any(Function));
        expect(global.console.warn).toEqual(expect.any(Function));
    });
});

describe('Security Middleware - Rate Limiting', () => {
    beforeAll(async () => {
        adminToken = generateToken({ id: 1, email: 'admin@test.com', role: 'admin' });
        testToken = generateToken({ id: 2, email: 'user@test.com', role: 'user' });
        
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
                        .set('Authorization', `Bearer ${testToken}`)
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
                            .set('Authorization', `Bearer ${testToken}`)
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
                .set('Authorization', `Bearer ${testToken}`);

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
                    .set('Authorization', `Bearer ${testToken}`),
                request(app)
                    .get('/api/lessons/1')
                    .set('X-Forwarded-For', testIp)
                    .set('Authorization', `Bearer ${testToken}`),
                request(app)
                    .get('/api/profile')
                    .set('X-Forwarded-For', testIp)
                    .set('Authorization', `Bearer ${testToken}`)
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
                .set('Authorization', `Bearer ${testToken}`);

            expect(response.status).not.toBe(403);
        }, 15000);
    });
});

describe('Input Validation', () => {
    test('should validate email format on register', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'invalid-email',
                password: 'password123'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors).toContainEqual(
            expect.objectContaining({
                path: 'email',
                msg: 'Email non valida'
            })
        );
    });

    test('should validate password strength on register', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: '123'  // too weak
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors).toContainEqual(
            expect.objectContaining({
                path: 'password',
                msg: 'Password deve contenere almeno 8 caratteri, una lettera e un numero'
            })
        );
    });

    test('should validate course creation data', async () => {
        const response = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: '',  // empty title
                description: 'Test Description',
                difficulty_level: 'invalid_level',
                duration_hours: -1
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
    });
});

describe('Content Sanitization', () => {    
    test('should sanitize malicious HTML content', () => {
        const maliciousContent = '<p>Normal text</p><script>alert("xss")</script><img src="x" onerror="alert(1)"/>';
        const sanitized = sanitizeContent(maliciousContent);
        
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).toContain('<p>Normal text</p>');
    });

    test('should preserve safe HTML elements and attributes', () => {
        const safeContent = '<p class="text-large">Test</p><a href="https://example.com">Link</a>';
        const sanitized = sanitizeContent(safeContent);
        
        expect(sanitized).toBe(safeContent);
    });

    test('should sanitize lesson content on creation', async () => {
        // Prima creiamo un corso di test
        const courseResponse = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Test Course',
                description: 'Test Description',
                difficulty_level: 'beginner',
                duration_hours: 1
            });
    
        expect(courseResponse.status).toBe(201);
        const courseId = courseResponse.body.data.id;
    
        const response = await request(app)
            .post('/api/lessons')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                courseId: courseId,
                title: 'Test Lesson',
                content: '<p>Safe content</p><script>alert("unsafe")</script>',
                orderNumber: 1,
                templateType: 'theory',
                contentFormat: 'markdown',
                metaDescription: 'Test description',
                estimatedMinutes: 30,
                status: 'draft'
            });
    
        expect(response.status).toBe(201);
        expect(response.body.data.content).not.toContain('<script>');
        expect(response.body.data.content).toContain('<p>Safe content</p>');
    }, 30000);

    test('should handle course description sanitization', async () => {
        const response = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Test Course',
                description: '<p>Description</p><iframe src="evil.com"></iframe>',
                difficulty_level: 'beginner',
                duration_hours: 1
            });

        expect(response.status).toBe(201);
        expect(response.body.data.description).not.toContain('<iframe');
        expect(response.body.data.description).toContain('<p>Description</p>');
    });
});