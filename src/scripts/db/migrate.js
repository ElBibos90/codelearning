// src/scripts/db/migrate.js
import dotenv from 'dotenv';
import colors from 'colors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';  // Corretto l'import di fs
import { pool } from '../../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../migrations');

async function migrate() {
    const client = await pool.connect();
    
    try {
        console.log('Inizializzazione migrazioni...'.cyan);

        // Crea tabella migrazioni se non esiste
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Leggi tutte le migrazioni eseguite
        const { rows: executedMigrations } = await client.query(
            'SELECT name FROM migrations ORDER BY executed_at'
        );
        const executedMigrationNames = new Set(executedMigrations.map(m => m.name));

        // Leggi i file di migrazione
        const migrationFiles = (await fs.readdir(MIGRATIONS_DIR))
            .filter(f => f.endsWith('.sql'))
            .filter(f => !f.includes('_prod.sql')) // Escludi file di produzione
            .filter(f => !executedMigrationNames.has(f))
            .sort();

        if (migrationFiles.length === 0) {
            console.log('Nessuna nuova migrazione da eseguire'.green);
            return;
        }

        console.log(`Trovate ${migrationFiles.length} migrazioni da eseguire:`.yellow);

        for (const migrationFile of migrationFiles) {
            try {
                await client.query('BEGIN');
                
                console.log(`\nEsecuzione ${migrationFile}...`.cyan);
                
                const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
                const migrationSql = await fs.readFile(migrationPath, 'utf8');

                await client.query(migrationSql);
                
                // Registra la migrazione
                await client.query(
                    'INSERT INTO migrations (name) VALUES ($1)',
                    [migrationFile]
                );

                await client.query('COMMIT');
                console.log(`✓ Migrazione ${migrationFile} completata`.green);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error(`✗ Errore nella migrazione ${migrationFile}:`.red, error);
                throw error;
            }
        }

        console.log('\n✓ Tutte le migrazioni completate con successo'.green);

    } catch (error) {
        console.error('✗ Errore durante le migrazioni:'.red, error);
        throw error;
    } finally {
        client.release();
    }
}

// Esegui se chiamato direttamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    migrate()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export { migrate };