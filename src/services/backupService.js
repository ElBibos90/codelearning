import schedule from 'node-schedule';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import pkg from 'pg';
const { Pool } = pkg;
import { 
    BACKUP_CONFIG, 
    DB_CONFIG, 
    SERVER_CONFIG 
} from '../config/environments.js';

const pool = new Pool({
    connectionString: DB_CONFIG.url
});

class BackupService {
    constructor() {
        fs.ensureDirSync(BACKUP_CONFIG.backupDir);
        
        // Verifica l'esistenza dei file pg_dump e pg_restore
        const pgDumpPath = path.join(BACKUP_CONFIG.postgresqlBin, 'pg_dump.exe');
        const pgRestorePath = path.join(BACKUP_CONFIG.postgresqlBin, 'pg_restore.exe');
        
        if (!fs.existsSync(pgDumpPath)) {
            console.error(`pg_dump non trovato in: ${pgDumpPath}`);
        }
        if (!fs.existsSync(pgRestorePath)) {
            console.error(`pg_restore non trovato in: ${pgRestorePath}`);
        }
    }

    createBackupCommand(filePath) {
        const pgDumpPath = path.join(BACKUP_CONFIG.postgresqlBin, 'pg_dump.exe');
        
        return `"${pgDumpPath}" -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} ` +
               `-U ${DB_CONFIG.user} -F c -b -v -f "${filePath}" ${DB_CONFIG.database}`;
    }

    createRestoreCommand(filePath) {
        const pgRestorePath = path.join(BACKUP_CONFIG.postgresqlBin, 'pg_restore.exe');
        
        return `"${pgRestorePath}" -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} ` +
               `-U ${DB_CONFIG.user} -d ${DB_CONFIG.database} ` +
               `--clean --if-exists --no-owner --no-privileges ` +
               `--single-transaction -v "${filePath}"`;
    }

    async performBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup-${timestamp}.backup`;
        const filePath = path.join(BACKUP_CONFIG.backupDir, fileName);

        if (!SERVER_CONFIG.isTest) {
            console.log('Iniziando il backup...');
            console.log(`File di destinazione: ${filePath}`);
        }

        try {
            const cmd = this.createBackupCommand(filePath);
            if (!SERVER_CONFIG.isTest) {
                console.log('Esecuzione comando:', cmd);
            }

            await new Promise((resolve, reject) => {
                const env = { PGPASSWORD: DB_CONFIG.password };
                exec(cmd, { env }, (error, stdout, stderr) => {
                    if (!SERVER_CONFIG.isTest) {
                        if (stdout) console.log('STDOUT:', stdout);
                        if (stderr) console.log('STDERR:', stderr);
                    }
                    
                    if (error) {
                        console.error('Errore durante il backup:', error);
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });

            if (!SERVER_CONFIG.isTest) {
                console.log('Backup completato con successo');
            }
            await this.cleanOldBackups();

            return {
                success: true,
                fileName,
                path: filePath,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Errore durante il backup:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    async cleanOldBackups() {
        try {
            const files = await fs.readdir(BACKUP_CONFIG.backupDir);
            const now = new Date();

            for (const file of files) {
                const filePath = path.join(BACKUP_CONFIG.backupDir, file);
                const stats = await fs.stat(filePath);
                const daysOld = (now - stats.mtime) / (1000 * 60 * 60 * 24);

                if (daysOld > BACKUP_CONFIG.retentionDays) {
                    await fs.remove(filePath);
                    if (!SERVER_CONFIG.isTest) {
                        console.log(`Backup vecchio rimosso: ${file}`);
                    }
                }
            }
        } catch (error) {
            console.error('Errore durante la pulizia dei backup:', error);
        }
    }

    scheduleBackups() {
        // Esegue il backup ogni giorno alle 3:00
        const job = schedule.scheduleJob('0 3 * * *', async () => {
            console.log('Avvio backup programmato...');
            await this.performBackup();
        });
        
        if (!SERVER_CONFIG.isTest) {
            console.log('Backup programmati configurati');
        }
        return job;
    }

    async listBackups() {
        try {
            const files = await fs.readdir(BACKUP_CONFIG.backupDir);
            const backups = await Promise.all(
                files.map(async (file) => {
                    const filePath = path.join(BACKUP_CONFIG.backupDir, file);
                    const stats = await fs.stat(filePath);
                    return {
                        fileName: file,
                        size: stats.size,
                        created: stats.mtime
                    };
                })
            );

            return backups.sort((a, b) => b.created - a.created);
        } catch (error) {
            console.error('Errore durante la lettura dei backup:', error);
            throw error;
        }
    }
}

export default new BackupService();