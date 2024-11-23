// src/middleware/security.js
import rateLimit from 'express-rate-limit';
import { redisClient } from '../config/redis.js';

class SecurityStore {
    constructor() {
        this.prefix = 'rl:';
        this.blacklistPrefix = 'bl:';
        this.violationPrefix = 'vl:';
    }

    getFullKey(key) {
        return this.prefix + key;
    }

    getBlacklistKey(ip) {
        return this.blacklistPrefix + ip;
    }

    getViolationKey(ip) {
        return this.violationPrefix + ip;
    }

    async isBlacklisted(ip) {
        const blacklisted = await redisClient.get(this.getBlacklistKey(ip));
        return !!blacklisted;
    }

    async addToBlacklist(ip) {
        const expiryTime = process.env.NODE_ENV === 'test' ? 5 : 24 * 60 * 60;
        await redisClient.set(
            this.getBlacklistKey(ip),
            '1',
            { EX: expiryTime }
        );
    }

    async incrementViolations(ip) {
        const violations = await redisClient.incr(this.getViolationKey(ip));
        await redisClient.expire(this.getViolationKey(ip), process.env.NODE_ENV === 'test' ? 1 : 3600);
        
        const threshold = process.env.NODE_ENV === 'test' ? 3 : 10;
        
        if (violations >= threshold) {
            await this.addToBlacklist(ip);
            return true;
        }
        return false;
    }

    async increment(key) {
        const fullKey = this.getFullKey(key);
        const value = await redisClient.incr(fullKey);
        if (value === 1) {
            await redisClient.expire(fullKey, process.env.NODE_ENV === 'test' ? 1 : 3600);
        }
        return value;
    }

    async reset(key) {
        await redisClient.del(this.getFullKey(key));
    }
}

const store = new SecurityStore();

function createLimiter(options) {
    const windowMs = process.env.NODE_ENV === 'test' ? 1000 : options.windowMs;
    const max = process.env.NODE_ENV === 'test' ? options.testMax : options.max;

    return async (req, res, next) => {
        try {
            const ip = req.get('X-Forwarded-For') || req.ip;

            // Verifica blacklist prima di tutto
            const isBlacklisted = await store.isBlacklisted(ip);
            if (isBlacklisted) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied due to repeated violations'
                });
            }

            const key = `${ip}:${options.type}:${req.path}`;
            const hits = await store.increment(key);

            if (hits > max) {
                const wasBlacklisted = await store.incrementViolations(ip);
                
                if (wasBlacklisted) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied due to repeated violations'
                    });
                }

                return res.status(429).json({
                    success: false,
                    message: 'Rate limit exceeded'
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

const configs = {
    auth: {
        type: 'auth',
        windowMs: 60 * 60 * 1000,
        max: 5,
        testMax: 3
    },
    admin: {
        type: 'admin',
        windowMs: 15 * 60 * 1000,
        max: 30,
        testMax: 5
    },
    api: {
        type: 'api',
        windowMs: 15 * 60 * 1000,
        max: 100,
        testMax: 10
    }
};

export const authLimiter = createLimiter(configs.auth);
export const adminLimiter = createLimiter(configs.admin);
export const apiLimiter = createLimiter(configs.api);

export const checkBlacklist = async (req, res, next) => {
    try {
        const ip = req.get('X-Forwarded-For') || req.ip;
        
        if (await store.isBlacklisted(ip)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied due to repeated violations'
            });
        }
        
        next();
    } catch (error) {
        next(error);
    }
};

export const securityMiddleware = {
    authLimiter,
    adminLimiter,
    apiLimiter,
    checkBlacklist
};