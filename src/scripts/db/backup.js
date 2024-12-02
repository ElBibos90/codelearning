// src/scripts/db/backup.js
import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';
import { BACKUP_CONFIG, DB_CONFIG } from '../../config/environments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.resolve(__dirname, '../../../backups');

async function createBackup(dbManager) {
    try {
        // Assicura che la directory dei backup esista
        await fs.ensureDir(BACKUP_DIR);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup-${timestamp}.sql`;
        const filePath = path.join(BACKUP_DIR, fileName);

        console.log('Inizializzazione backup...'.cyan);
        console.log(`Directory backup: ${BACKUP_DIR}`.yellow);
        console.log(`File di backup: ${fileName}`.yellow);

        // Verifica la connessione al database prima del backup
        try {
            await dbManager.query('SELECT 1');
            console.log('✓ Database connection verified'.green);
        } catch (error) {
            throw new Error('Impossibile connettersi al database');
        }

        // Costruisci il comando pg_dump
        const pgDumpPath = path.join(BACKUP_CONFIG.postgresqlBin, 'pg_dump.exe');
        const command = `"${pgDumpPath}" -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -F c -b -v -f "${filePath}" ${DB_CONFIG.database}`;

        // Esegui il backup
        console.log('\nExecuting backup...'.yellow);
        await new Promise((resolve, reject) => {
            exec(command, { 
                env: { PGPASSWORD: DB_CONFIG.password },
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            }, 
            (error, stdout, stderr) => {
                console.log('Log:'.yellow, stderr);
                
                if (error) {
                    console.error('✗ Backup error:'.red, error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        // Verifica il file di backup
        const stats = await fs.stat(filePath);
        console.log(`\nBackup size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`.cyan);

        // Pulisci i backup vecchi
        console.log('\nCleaning old backups...'.yellow);
        try {
            const oldBackupsRemoved = await cleanOldBackups();
            console.log(`✓ ${oldBackupsRemoved.count} old backups removed`.green);
            console.log(`✓ Space freed: ${(oldBackupsRemoved.spaceFreed / (1024 * 1024)).toFixed(2)} MB`.green);
        } catch (error) {
            console.error('Error cleaning old backups:', error);
        }

        // Registro il backup nel database
        await dbManager.query(`
            INSERT INTO maintenance_logs (
                job_name,
                success,
                details,
                executed_at
            ) VALUES (
                'database_backup',
                true,
                $1,
                CURRENT_TIMESTAMP
            )
        `, [JSON.stringify({
            filename: fileName,
            size: stats.size,
            timestamp: new Date().toISOString()
        })]);

        return {
            success: true,
            filePath,
            timestamp: new Date()
        };

    } catch (error) {
        console.error('✗ Backup error:'.red, error);
        
        // Log dell'errore nel database
        if (dbManager) {
            try {
                await dbManager.query(`
                    INSERT INTO maintenance_logs (
                        job_name,
                        success,
                        error_message,
                        executed_at
                    ) VALUES (
                        'database_backup',
                        false,
                        $1,
                        CURRENT_TIMESTAMP
                    )
                `, [error.message]);
            } catch (logError) {
                console.error('Error logging to database:', logError);
            }
        }
        
        throw error;
    }
}

async function cleanOldBackups() {
    let count = 0;
    let spaceFreed = 0;
    const files = await fs.readdir(BACKUP_DIR);
    const now = new Date();

    for (const file of files) {
        if (file.startsWith('backup-') && file.endsWith('.sql')) {
            const filePath = path.join(BACKUP_DIR, file);
            const stats = await fs.stat(filePath);
            const daysOld = (now - stats.mtime) / (1000 * 60 * 60 * 24);

            if (daysOld > BACKUP_RETENTION_DAYS) {
                spaceFreed += stats.size;
                await fs.remove(filePath);
                count++;
            }
        }
    }

    return { count, spaceFreed };
}

// Esegui se chiamato direttamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    import('../../utils/testDbManager.js').then(({ testDbManager }) => {
        createBackup(testDbManager)
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
    });
}

export { createBackup, cleanOldBackups };