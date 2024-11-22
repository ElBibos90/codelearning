import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Crea il client Redis
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD
});

// Gestione eventi di connessione
redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Connetti al server Redis
await redisClient.connect();

// Utility function per il caching
const cacheData = async (key, data, timeExp = 3600) => {
    try {
        await redisClient.setEx(key, timeExp, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Cache Error:', error);
        return false;
    }
};

// Utility function per recuperare dati dalla cache
const getCachedData = async (key) => {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Cache Error:', error);
        return null;
    }
};

// Utility function per eliminare dati dalla cache
const deleteCachedData = async (key) => {
    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.error('Cache Error:', error);
        return false;
    }
};

export {
    redisClient,
    cacheData,
    getCachedData,
    deleteCachedData
};