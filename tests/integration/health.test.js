import request from 'supertest';import app from '../../src/server.js';describe('Health Check', () => {    test('GET / should return 200', async () => {        const response = await request(app).get('/');        expect(response.status).toBe(200);        expect(response.body).toHaveProperty('message', 'Server funzionante!');    });});