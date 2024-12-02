import pkg from 'pg';
import bcrypt from 'bcryptjs';
import { DB_CONFIG } from '../config/environments.js';
const { Pool } = pkg;

const pool = new Pool({
    user: DB_CONFIG.user,
    host: DB_CONFIG.host,
    database: DB_CONFIG.database,
    password: DB_CONFIG.password,
    port: DB_CONFIG.port
});

const SALT_ROUNDS = 10;

export const userModel = {
    async create(userData) {
        const { name, email, password } = userData;
        
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        const query = {
            text: 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at',
            values: [name, email, hashedPassword],
        };
        
        try {
            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                throw new Error('Email già registrata');
            }
            throw new Error(`Errore nella creazione dell'utente: ${error.message}`);
        }
    },

    async findByEmail(email) {
        const query = {
            text: 'SELECT * FROM users WHERE email = $1',
            values: [email],
        };
        try {
            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Errore nella ricerca dell'utente: ${error.message}`);
        }
    },

    async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    },

    async findById(id) {
        const query = {
            text: 'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
            values: [id],
        };
        try {
            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Errore nella ricerca dell'utente: ${error.message}`);
        }
    }
};