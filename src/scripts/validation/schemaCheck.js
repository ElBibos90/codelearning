// src/scripts/validation/schemaCheck.js
import colors from 'colors';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkDatabaseSchema(dbManager) {
    const startTime = Date.now();
    try {
        console.log('Avvio verifica schema database...\n'.cyan);

        // 1. Verifica struttura tabelle
        console.log('Tabelle trovate:'.yellow);
        const tables = await dbManager.query(`
            SELECT 
                t.table_name,
                t.table_type,
                obj_description(pgc.oid, 'pg_class') as table_comment,
                (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
                pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name))) as table_size,
                pg_size_pretty(pg_indexes_size(quote_ident(t.table_name))) as index_size,
                (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) as index_count
            FROM information_schema.tables t
            INNER JOIN pg_class pgc ON pgc.relname = t.table_name
            WHERE t.table_schema = 'public'
            ORDER BY t.table_name;
        `);

        const schemaIssues = [];

        for (const table of tables.rows) {
            console.log(`\n${table.table_name}:`.green);
            console.log(`  Tipo: ${table.table_type}`.cyan);
            console.log(`  Colonne: ${table.column_count}`.cyan);
            console.log(`  Dimensione Tabella: ${table.table_size}`.cyan);
            console.log(`  Dimensione Indici: ${table.index_size}`.cyan);
            console.log(`  Numero Indici: ${table.index_count}`.cyan);
            if (table.table_comment) {
                console.log(`  Commento: ${table.table_comment}`.cyan);
            }

            // Dettagli colonne
            const columns = await dbManager.query(`
                SELECT 
                    column_name,
                    data_type,
                    character_maximum_length,
                    column_default,
                    is_nullable,
                    col_description(pg_class.oid, ordinal_position) as column_comment
                FROM information_schema.columns
                JOIN pg_class ON pg_class.relname = table_name
                WHERE table_name = $1
                ORDER BY ordinal_position;
            `, [table.table_name]);

            console.log('  Colonne:'.yellow);
            columns.rows.forEach(column => {
                let columnInfo = `    - ${column.column_name}: ${column.data_type}`;
                if (column.character_maximum_length) {
                    columnInfo += `(${column.character_maximum_length})`;
                }
                if (column.column_default) {
                    columnInfo += ` = ${column.column_default}`;
                }
                if (column.is_nullable === 'NO') {
                    columnInfo += ' NOT NULL';
                }
                console.log(columnInfo.cyan);
                
                // Verifica potenziali problemi
                if (column.is_nullable === 'YES' && !column.column_default) {
                    schemaIssues.push({
                        table: table.table_name,
                        column: column.column_name,
                        issue: 'Nullable column without default value'
                    });
                }
            });
        }

        // Durata totale
        const duration = Date.now() - startTime;

        // Creazione report
        const report = {
            timestamp: new Date(),
            tables_analyzed: tables.rows.length,
            schema_issues: schemaIssues,
            tables_info: tables.rows.map(t => ({
                name: t.table_name,
                columns: t.column_count,
                size: t.table_size,
                indexes: t.index_count
            }))
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
                'database_schema_validation',
                $1,
                $2,
                $3,
                $4,
                CURRENT_TIMESTAMP
            )
        `, [
            schemaIssues.length === 0, // success
            duration,
            JSON.stringify(report),
            schemaIssues.length > 0 ? `Found ${schemaIssues.length} schema issues` : null
        ]);

        console.log('\n✓ Verifica schema completata'.green);

    } catch (error) {
        console.error('Errore durante la verifica dello schema:'.red, error);
        
        // Log dell'errore
        await dbManager.query(`
            INSERT INTO maintenance_logs (
                job_name,
                success,
                error_message,
                executed_at
            ) VALUES (
                'database_schema_validation',
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
        checkDatabaseSchema(testDbManager)
            .then(() => {
                console.log('\n✓ Verifica schema completata con successo'.green);
                process.exit(0);
            })
            .catch((error) => {
                console.error('\n✗ Verifica schema fallita:'.red, error);
                process.exit(1);
            });
    });
}

export { checkDatabaseSchema };