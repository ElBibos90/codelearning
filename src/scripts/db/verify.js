import { pool } from '../../config/database.js';
import colors from 'colors';

async function verifyDatabase() {
    try {
        console.log('Verifica integrità database...'.cyan);

        // Verifica integrità referenziale
        console.log('\nVerifica integrità referenziale:'.yellow);
        
        const checks = [
            {
                name: 'Lezioni orfane',
                query: `
                    SELECT COUNT(*) as count
                    FROM lessons l
                    LEFT JOIN courses c ON l.course_id = c.id
                    WHERE c.id IS NULL
                `
            },
            {
                name: 'Iscrizioni invalide',
                query: `
                    SELECT COUNT(*) as count
                    FROM course_enrollments ce
                    LEFT JOIN courses c ON ce.course_id = c.id
                    WHERE c.id IS NULL
                `
            },
            {
                name: 'Utenti con iscrizioni duplicate',
                query: `
                    SELECT user_id, course_id, COUNT(*) as count
                    FROM course_enrollments
                    GROUP BY user_id, course_id
                    HAVING COUNT(*) > 1
                `
            }
        ];

        for (const check of checks) {
            const result = await pool.query(check.query);
            const count = result.rows[0].count;
            
            if (count > 0) {
                console.log(`✗ ${check.name}: ${count} problemi trovati`.red);
            } else {
                console.log(`✓ ${check.name}: OK`.green);
            }
        }

        // Verifica consistenza dati
        console.log('\nVerifica consistenza dati:'.yellow);

        // Verifica progressi lezioni
        const lessonProgress = await pool.query(`
            SELECT 
                c.title as course_title,
                COUNT(DISTINCT l.id) as total_lessons,
                COUNT(DISTINCT lp.lesson_id) as tracked_lessons
            FROM courses c
            LEFT JOIN lessons l ON l.course_id = c.id
            LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id
            GROUP BY c.id, c.title
            HAVING COUNT(DISTINCT l.id) != COUNT(DISTINCT lp.lesson_id)
        `);

        if (lessonProgress.rows.length > 0) {
            console.log('✗ Incongruenze nei progressi delle lezioni:'.red);
            lessonProgress.rows.forEach(row => {
                console.log(`  - ${row.course_title}: ${row.tracked_lessons}/${row.total_lessons} lezioni tracciate`.red);
            });
        } else {
            console.log('✓ Progressi lezioni: OK'.green);
        }

        // Verifica stati lezioni
        const lessonStates = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM lessons
            GROUP BY status
        `);

        console.log('\nDistribuzione stati lezioni:'.yellow);
        lessonStates.rows.forEach(state => {
            console.log(`- ${state.status}: ${state.count} lezioni`.cyan);
        });

        // Verifica performance indici
        console.log('\nVerifica performance indici:'.yellow);
        const tableStats = await pool.query(`
            SELECT 
                schemaname,
                tablename,
                n_live_tup as rows,
                n_dead_tup as dead_rows
            FROM pg_stat_user_tables
            WHERE schemaname = 'public'
        `);

        tableStats.rows.forEach(stat => {
            const deadRowPercentage = (stat.dead_rows / (stat.rows + stat.dead_rows)) * 100;
            if (deadRowPercentage > 10) {
                console.log(`✗ ${stat.tablename}: ${deadRowPercentage.toFixed(2)}% righe morte`.red);
            } else {
                console.log(`✓ ${stat.tablename}: OK`.green);
            }
        });

    } catch (error) {
        console.error('Errore durante la verifica:'.red, error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Esegui se chiamato direttamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    verifyDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export { verifyDatabase };