// src/config/redisClient.js
import { createClient } from 'redis';

const client = createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD
});

client.on('error', err => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('Redis connected'));

export const connectRedis = async () => {
    await client.connect();
};

export default client;