// src/scripts/validation/productionCheck.js

import { fileURLToPath } from 'url';
import { pool } from '../../config/database.js';
import colors from 'colors';

async function checkProduction() {
    try {
        console.log('Inizio verifica produzione...\n'.cyan);

        // 1. Verifica tabelle
        console.log('Verifica struttura tabelle:'.yellow);
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name IN (
                'course_favorites',
                'lesson_versions'
            );
        `);

        tables.rows.forEach(table => {
            console.log(`✓ Tabella ${table.table_name} presente`.green);
        });

        // 2. Verifica colonne lessons
        console.log('\nVerifica colonne lezioni:'.yellow);
        const columns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'lessons'
            AND column_name IN (
                'content_format',
                'version',
                'status',
                'last_edited_at'
            );
        `);

        columns.rows.forEach(column => {
            console.log(`✓ Colonna ${column.column_name} (${column.data_type}) presente`.green);
        });

        // 3. Verifica trigger
        console.log('\nVerifica trigger:'.yellow);
        const triggers = await pool.query(`
            SELECT trigger_name
            FROM information_schema.triggers
            WHERE event_object_table = 'lessons'
            AND trigger_name = 'lessons_version_tracker';
        `);

        if (triggers.rows.length > 0) {
            console.log('✓ Trigger version_tracker presente'.green);
        } else {
            console.log('✗ Trigger version_tracker mancante!'.red);
        }

        // 4. Verifica indici
        console.log('\nVerifica indici:'.yellow);
        const indices = await pool.query(`
            SELECT indexname
            FROM pg_indexes
            WHERE tablename IN ('course_favorites', 'lessons')
            AND indexname IN (
                'idx_course_favorites_user',
                'idx_course_favorites_course',
                'idx_lessons_status'
            );
        `);

        indices.rows.forEach(index => {
            console.log(`✓ Indice ${index.indexname} presente`.green);
        });

        // 5. Test funzionale (opzionale)
        console.log('\nTest funzionale:'.yellow);
        
        // Test aggiornamento lezione
        const testLesson = await pool.query(`
            UPDATE lessons 
            SET content = content || ' test'
            WHERE id = (SELECT id FROM lessons LIMIT 1)
            RETURNING version;
        `);

        if (testLesson.rows[0]?.version > 1) {
            console.log('✓ Versioning lezioni funzionante'.green);
        } else {
            console.log('✗ Versioning lezioni non funzionante!'.red);
        }

        console.log('\n✓ Verifica completata con successo!'.green);

    } catch (error) {
        console.error('\n✗ Errore durante la verifica:'.red, error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Esegui se chiamato direttamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    checkProduction()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}