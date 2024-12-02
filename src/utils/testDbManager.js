// src/utils/testDbManager.js
import pg from 'pg';
import colors from 'colors';
import { DB_CONFIG } from '../config/environments.js';


const { Pool } = pg;

class TestDatabaseManager {
  constructor() {
    this._pool = null;
  }

  get pool() {
    if (!this._pool) {
       this._pool = new Pool({
             user: DB_CONFIG.test.user,
             host: DB_CONFIG.test.host,
             database: DB_CONFIG.test.database,
             password: DB_CONFIG.test.password,
             port: DB_CONFIG.test.port
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