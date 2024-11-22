// src/scripts/validation/dataCheck.js
import colors from 'colors';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkDatabaseData(dbManager) {
    const startTime = Date.now();
    try {
        console.log('Avvio verifica dati database...\n'.cyan);

        // Controllo utenti
        const userStats = await dbManager.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
                COUNT(CASE WHEN last_login IS NULL THEN 1 END) as never_logged_users,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users
            FROM users;
        `);

        console.log('\nStatistiche Utenti:'.green);
        console.log(`Totale utenti: ${userStats.rows[0].total_users}`.cyan);
        console.log(`Admins: ${userStats.rows[0].admin_count}`.cyan);
        console.log(`Mai loggati: ${userStats.rows[0].never_logged_users}`.cyan);
        console.log(`Nuovi utenti (30gg): ${userStats.rows[0].new_users}`.cyan);

        // Statistiche corsi
        const courseStats = await dbManager.query(`
            SELECT 
                c.id,
                c.title,
                COUNT(DISTINCT l.id) as lesson_count,
                COUNT(DISTINCT ce.user_id) as enrolled_users,
                COUNT(DISTINCT CASE WHEN ce.completed THEN ce.user_id END) as completed_users,
                COUNT(DISTINCT lr.id) as resources_count,
                MAX(l.order_number) as max_lesson_order
            FROM courses c
            LEFT JOIN lessons l ON l.course_id = c.id
            LEFT JOIN course_enrollments ce ON ce.course_id = c.id
            LEFT JOIN lesson_resources lr ON lr.lesson_id = l.id
            GROUP BY c.id, c.title
            ORDER BY c.id;
        `);

        console.log('\nStatistiche Corsi:'.yellow);
        courseStats.rows.forEach(course => {
            console.log(`\n${course.title}:`.cyan);
            console.log(`  Lezioni: ${course.lesson_count}`.cyan);
            console.log(`  Iscritti: ${course.enrolled_users}`.cyan);
            console.log(`  Completati: ${course.completed_users}`.cyan);
            console.log(`  Risorse: ${course.resources_count}`.cyan);
        });

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
                name: 'Progressi lezioni orfani',
                query: `
                    SELECT COUNT(*) as count
                    FROM lesson_progress lp
                    LEFT JOIN lessons l ON lp.lesson_id = l.id
                    WHERE l.id IS NULL
                `
            }
        ];

        const issues = {
            total: 0,
            details: []
        };

        for (const check of checks) {
            const result = await dbManager.query(check.query);
            const count = parseInt(result.rows[0].count);
            issues.total += count;
            
            if (count > 0) {
                console.log(`✗ ${check.name}: ${count} problemi trovati`.red);
                issues.details.push({ issue: check.name, count });
            } else {
                console.log(`✓ ${check.name}: OK`.green);
            }
        }

        // Durata totale
        const duration = Date.now() - startTime;

        // Salvataggio report
        const report = {
            timestamp: new Date(),
            user_stats: userStats.rows[0],
            course_stats: courseStats.rows,
            integrity_issues: issues,
            duration_ms: duration
        };

        // Log del risultato
        await dbManager.query(`
            INSERT INTO maintenance_logs (
                job_name,
                success,
                duration,
                details,
                error_message,
                executed_at
            ) VALUES (
                'database_data_validation',
                $1,
                $2,
                $3,
                $4,
                CURRENT_TIMESTAMP
            )
        `, [
            issues.total === 0, // success
            duration,
            JSON.stringify(report),
            issues.total > 0 ? `Found ${issues.total} data integrity issues` : null
        ]);

        console.log('\n✓ Verifica dati completata'.green);

    } catch (error) {
        console.error('Errore durante la verifica dei dati:'.red, error);
        
        // Log dell'errore
        await dbManager.query(`
            INSERT INTO maintenance_logs (
                job_name,
                success,
                error_message,
                executed_at
            ) VALUES (
                'database_data_validation',
                false,
                $1,
                CURRENT_TIMESTAMP
            )
        `, [error.message]);
        
        throw error;
    }
}

// Esegui se chiamato direttamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    import('../../utils/testDbManager.js').then(({ testDbManager }) => {
        checkDatabaseData(testDbManager)
            .then(() => {
                console.log('\n✓ Verifica dati completata con successo'.green);
                process.exit(0);
            })
            .catch((error) => {
                console.error('\n✗ Verifica dati fallita:'.red, error);
                process.exit(1);
            });
    });
}

export { checkDatabaseData };