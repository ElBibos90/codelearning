// src/utils/testDbManager.js
import pg from 'pg';
import dotenv from 'dotenv';
import colors from 'colors';

dotenv.config();
const { Pool } = pg;

class TestDatabaseManager {
  constructor() {
    this._pool = null;
  }

  get pool() {
    if (!this._pool) {
      this._pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
    }
    return this._pool;
  }

  async query(...args) {
    return await this.pool.query(...args);
  }

  async getClient() {
    return await this.pool.connect();
  }

  async end() {
    if (this._pool) {
      await this._pool.end();
      this._pool = null;
    }
  }
}

export const testDbManager = new TestDatabaseManager();