import { createClient } from 'redis';
import { REDIS_CONFIG, SERVER_CONFIG } from './environments.js';

const client = createClient({
    url: REDIS_CONFIG.url,
    password: REDIS_CONFIG.password
});

client.on('error', err => console.error('Redis Client Error:', err));
client.on('connect', () => {
    if (!SERVER_CONFIG.isTest) {
        console.log('Redis connected');
    }
});

export const connectRedis = async () => {
    await client.connect();
};

export default client;