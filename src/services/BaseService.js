// src/services/BaseService.js
import DatabaseError from '../utils/errors/DatabaseError.js';
import { getCachedData, cacheData, deleteCachedData } from '../config/redis';

class BaseService {
    constructor(model) {
        if (!model) {
            throw new Error('Model is required for BaseService');
        }
        this.model = model;
        this.cacheDuration = 3600; // 1 hour default
    }

    // Base CRUD operations
    async findById(id) {
        const cacheKey = `${this.model.name}:${id}`;
        try {
            // Check cache first
            const cached = await getCachedData(cacheKey);
            if (cached) return cached;

            // Get from database
            const result = await this.model.findById(id);
            if (!result) {
                return null;
            }

            // Cache result
            await cacheData(cacheKey, result, this.cacheDuration);
            return result;
        } catch (error) {
            throw new DatabaseError(error);
        }
    }

    async create(data) {
        try {
            const result = await this.model.create(data);
            return result;
        } catch (error) {
            throw new DatabaseError(error);
        }
    }

    async update(id, data) {
        try {
            const result = await this.model.update(id, data);
            if (!result) {
                return null;
            }
            // Clear cache
            await this.clearCache(id);
            return result;
        } catch (error) {
            throw new DatabaseError(error);
        }
    }

    async delete(id) {
        try {
            const result = await this.model.delete(id);
            if (!result) {
                return null;
            }
            // Clear cache
            await this.clearCache(id);
            return result;
        } catch (error) {
            throw new DatabaseError(error);
        }
    }

    // Cache management
    async clearCache(id = null) {
        if (id) {
            await deleteCachedData(`${this.model.name}:${id}`);
        } else {
            await deleteCachedData(`${this.model.name}:*`);
        }
    }

    // Validation methods
    validate(data) {
        throw new Error('validate method must be implemented');
    }
}

export default BaseService;