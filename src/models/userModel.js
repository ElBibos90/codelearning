// src/models/userModel.js

import pkg from 'pg';
import bcrypt from 'bcryptjs';  // Cambiato da 'bcrypt' a 'bcryptjs'
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const SALT_ROUNDS = 10;

export const userModel = {
    // Creare un nuovo utente
    async create(userData) {
        const { name, email, password } = userData;
        
        // Hash della password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        const query = {
            text: 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at',
            values: [name, email, hashedPassword],
        };
        
        try {
            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') { // Codice PostgreSQL per violazione unique
                throw new Error('Email già registrata');
            }
            throw new Error(`Errore nella creazione dell'utente: ${error.message}`);
        }
    },

    // Trovare un utente per email
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

    // Verificare la password
    async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    },

    // Trovare un utente per ID
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