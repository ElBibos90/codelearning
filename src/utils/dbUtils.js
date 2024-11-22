import { pool as mainPool } from '../config/database.js';

export class DatabaseManager {
    constructor() {
        this.pool = mainPool;
    }

    async query(...args) {
        return await this.pool.query(...args);
    }

    async getClient() {
        return await this.pool.connect();
    }

    async end() {
        await this.pool.end();
    }
}

export const dbManager = new DatabaseManager();