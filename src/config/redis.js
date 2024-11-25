// src/config/redis.js
import client, { connectRedis } from './redisClient.js';

class RedisMock {
    constructor() {
        this.data = new Map();
        this.isOpen = true;
    }

    async connect() {
        this.isOpen = true;
        return true;
    }

    async quit() {
        this.isOpen = false;
        return true;
    }

    async set(key, value, options = {}) {
        if (options.EX) {
            setTimeout(() => {
                this.data.delete(key);
            }, options.EX * 1000);
        }
        this.data.set(key, value);
        return 'OK';
    }

    async get(key) {
        return this.data.get(key);
    }

    async incr(key) {
        const value = (parseInt(this.data.get(key)) || 0) + 1;
        this.data.set(key, value.toString());
        return value;
    }

    async decr(key) {
        const value = (parseInt(this.data.get(key)) || 0) - 1;
        this.data.set(key, value.toString());
        return value;
    }

    async del(key) {
        this.data.delete(key);
        return 1;
    }

    async flushAll() {
        this.data.clear();
        return 'OK';
    }

    async expire(key, seconds) {
        if (this.data.has(key)) {
            setTimeout(() => {
                this.data.delete(key);
            }, seconds * 1000);
            return 1;
        }
        return 0;
    }
}

export const redisClient = process.env.NODE_ENV === 'test' ? new RedisMock() : client;

// Inizializza Redis se non in ambiente test
if (process.env.NODE_ENV !== 'test') {
    connectRedis().catch(console.error);
}

export const cacheData = async (key, data, timeExp = 3600) => {
    try {
        await redisClient.set(key, JSON.stringify(data), { EX: timeExp });
        return true;
    } catch (error) {
        console.error('Cache Error:', error);
        return false;
    }
};

export const getCachedData = async (key) => {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Cache Error:', error);
        return null;
    }
};

export const deleteCachedData = async (key) => {
    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.error('Cache Error:', error);
        return false;
    }
};