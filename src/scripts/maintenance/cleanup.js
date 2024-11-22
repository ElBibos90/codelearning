// src/scripts/maintenance/cleanup.js
import colors from 'colors';
import { fileURLToPath } from 'url';
import path from 'path';
import { createBackup } from '../db/backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function performCleanup(dbManager) {
    const client = await dbManager.getClient();
    
    try {
        console.log('Avvio operazioni di pulizia database...\n'.cyan);

        // Prima creiamo un backup di sicurezza
        console.log('Creazione backup di sicurezza...'.yellow);
        await createBackup(dbManager);

        await client.query('BEGIN');

        // 1. Pulizia utenti inattivi
        console.log('\nPulizia utenti inattivi:'.yellow);
        const inactiveUsers = await client.query(`
            WITH inactive_enrollments AS (
                SELECT user_id, MAX(last_accessed) as last_activity
                FROM lesson_progress
                GROUP BY user_id
            )
            DELETE FROM users u
            WHERE 
                u.role != 'admin' AND
                u.id NOT IN (SELECT user_id FROM inactive_enrollments WHERE last_activity > NOW() - INTERVAL '6 months')
            RETURNING id, email;
        `);

        console.log(`✓ Rimossi ${inactiveUsers.rowCount} utenti inattivi`.green);

        // 2. Pulizia corsi vuoti
        console.log('\nPulizia corsi vuoti:'.yellow);
        const emptyCourses = await client.query(`
            DELETE FROM courses c
            WHERE NOT EXISTS (
                SELECT 1 FROM lessons l WHERE l.course_id = c.id
            )
            RETURNING id, title;
        `);

        console.log(`✓ Rimossi ${emptyCourses.rowCount} corsi vuoti`.green);

        // 3. Pulizia lezioni orfane
        console.log('\nPulizia lezioni orfane:'.yellow);
        const orphanLessons = await client.query(`
            DELETE FROM lessons l
            WHERE NOT EXISTS (
                SELECT 1 FROM courses c WHERE c.id = l.course_id
            )
            RETURNING id, title;
        `);

        console.log(`✓ Rimosse ${orphanLessons.rowCount} lezioni orfane`.green);

        // 4. Pulizia progressi obsoleti
        console.log('\nPulizia progressi obsoleti:'.yellow);
        const obsoleteProgress = await client.query(`
            DELETE FROM lesson_progress lp
            WHERE NOT EXISTS (
                SELECT 1 FROM lessons l WHERE l.id = lp.lesson_id
            )
            RETURNING id;
        `);

        console.log(`✓ Rimossi ${obsoleteProgress.rowCount} record di progresso obsoleti`.green);

        // 6. Report finale
        console.log('\nGenerazione report di pulizia:'.yellow);
        const report = {
            timestamp: new Date(),
            deleted_users: inactiveUsers.rowCount,
            deleted_courses: emptyCourses.rowCount,
            deleted_lessons: orphanLessons.rowCount,
            cleaned_progress: obsoleteProgress.rowCount,
            execution_date: new Date().toISOString()
        };

        await client.query(`
            INSERT INTO maintenance_logs (
                job_name,
                success,
                duration,
                details,
                executed_at
            ) VALUES (
                'database_cleanup',
                true,
                NULL,
                $1,
                CURRENT_TIMESTAMP
            )
        `, [JSON.stringify(report)]);

        await client.query('COMMIT');
        
        // 5. Ottimizzazione tabelle (fuori dalla transazione)
        console.log('\nOttimizzazione tabelle:'.yellow);
        const tables = [
            'users', 'courses', 'lessons', 'course_enrollments', 
            'lesson_progress', 'comments', 'lesson_resources',
            'lesson_versions', 'user_preferences', 'user_profiles'
        ];

        for (const table of tables) {
            try {
                // Usa una nuova connessione per ogni VACUUM
                const vacuumClient = await dbManager.getClient();
                try {
                    await vacuumClient.query(`VACUUM ANALYZE ${table}`);
                    console.log(`✓ Ottimizzata tabella ${table}`.green);
                } finally {
                    vacuumClient.release();
                }
            } catch (vacuumError) {
                console.error(`Errore durante l'ottimizzazione della tabella ${table}:`.red, vacuumError);
            }
        }
        
        console.log('\nReport di pulizia:'.green);
        console.log(JSON.stringify(report, null, 2).cyan);

        // 7. Statistiche post-pulizia
        console.log('\nStatistiche post-pulizia:'.yellow);
        const postCleanupStats = await client.query(`
            SELECT
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM courses) as total_courses,
                (SELECT COUNT(*) FROM lessons) as total_lessons,
                (SELECT COUNT(*) FROM lesson_progress) as total_progress_records,
                (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size
        `);

        console.log('Statistiche finali:'.cyan);
        console.log(`- Utenti totali: ${postCleanupStats.rows[0].total_users}`.cyan);
        console.log(`- Corsi totali: ${postCleanupStats.rows[0].total_courses}`.cyan);
        console.log(`- Lezioni totali: ${postCleanupStats.rows[0].total_lessons}`.cyan);
        console.log(`- Record di progresso: ${postCleanupStats.rows[0].total_progress_records}`.cyan);
        console.log(`- Dimensione database: ${postCleanupStats.rows[0].database_size}`.cyan);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Errore durante la pulizia:'.red, error);
        
        // Log dell'errore
        await client.query(`
            INSERT INTO maintenance_logs (
                job_name,
                success,
                error_message,
                executed_at
            ) VALUES (
                'database_cleanup',
                false,
                $1,
                CURRENT_TIMESTAMP
            )
        `, [error.message]);
        
        throw error;
    } finally {
        client.release();
    }
}

// Esegui se chiamato direttamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    import('../../utils/testDbManager.js').then(({ testDbManager }) => {
        performCleanup(testDbManager)
            .then(() => {
                console.log('\n✓ Operazioni di pulizia completate con successo'.green);
                process.exit(0);
            })
            .catch((error) => {
                console.error('\n✗ Errore durante le operazioni di pulizia:'.red, error);
                process.exit(1);
            });
    });
}

export { performCleanup };