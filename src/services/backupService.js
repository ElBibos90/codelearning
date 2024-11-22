import schedule from 'node-schedule';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

// Configura il percorso di PostgreSQL
const POSTGRESQL_BIN = 'C:\\Program Files\\PostgreSQL\\17\\bin'; // Modificare con la tua versione

const config = {
    backupDir: path.join(process.cwd(), 'backups'),
    retentionDays: 7,
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    }
};

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

class BackupService {
    constructor() {
        fs.ensureDirSync(config.backupDir);
        console.log(`Directory backup creata in: ${config.backupDir}`);
        
        // Verifica l'esistenza dei file pg_dump e pg_restore
        const pgDumpPath = path.join(POSTGRESQL_BIN, 'pg_dump.exe');
        const pgRestorePath = path.join(POSTGRESQL_BIN, 'pg_restore.exe');
        
        if (!fs.existsSync(pgDumpPath)) {
            console.error(`pg_dump non trovato in: ${pgDumpPath}`);
        }
        if (!fs.existsSync(pgRestorePath)) {
            console.error(`pg_restore non trovato in: ${pgRestorePath}`);
        }
    }

    createBackupCommand(filePath) {
        const pgDumpPath = path.join(POSTGRESQL_BIN, 'pg_dump.exe');
        
        return `"${pgDumpPath}" -h ${config.database.host} -p ${config.database.port} ` +
               `-U ${config.database.user} -F c -b -v -f "${filePath}" ${config.database.database}`;
    }

    createRestoreCommand(filePath) {
        const pgRestorePath = path.join(POSTGRESQL_BIN, 'pg_restore.exe');
        
        return `"${pgRestorePath}" -h ${config.database.host} -p ${config.database.port} ` +
               `-U ${config.database.user} -d ${config.database.database} ` +
               `--clean --if-exists --no-owner --no-privileges ` +
               `--single-transaction -v "${filePath}"`;
    }

    async performBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup-${timestamp}.backup`;
        const filePath = path.join(config.backupDir, fileName);

        console.log('Iniziando il backup...');
        console.log(`File di destinazione: ${filePath}`);

        try {
            const cmd = this.createBackupCommand(filePath);
            console.log('Esecuzione comando:', cmd);

            await new Promise((resolve, reject) => {
                const env = { ...process.env, PGPASSWORD: config.database.password };
                exec(cmd, { env }, (error, stdout, stderr) => {
                    if (stdout) console.log('STDOUT:', stdout);
                    if (stderr) console.log('STDERR:', stderr);
                    
                    if (error) {
                        console.error('Errore durante il backup:', error);
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });

            console.log('Backup completato con successo');
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
            const files = await fs.readdir(config.backupDir);
            const now = new Date();

            for (const file of files) {
                const filePath = path.join(config.backupDir, file);
                const stats = await fs.stat(filePath);
                const daysOld = (now - stats.mtime) / (1000 * 60 * 60 * 24);

                if (daysOld > config.retentionDays) {
                    await fs.remove(filePath);
                    console.log(`Backup vecchio rimosso: ${file}`);
                }
            }
        } catch (error) {
            console.error('Errore durante la pulizia dei backup:', error);
        }
    }

    async resetDatabase() {
        try {
            // Elimina lo schema public e lo ricrea
            await pool.query(`
                DROP SCHEMA public CASCADE;
                CREATE SCHEMA public;
                GRANT ALL ON SCHEMA public TO postgres;
                GRANT ALL ON SCHEMA public TO public;
            `);
            console.log('Database resettato con successo');
            return true;
        } catch (error) {
            console.error('Errore durante il reset del database:', error);
            return false;
        }
    }

    async restoreBackup(fileName) {
        const filePath = path.join(config.backupDir, fileName);

        if (!await fs.pathExists(filePath)) {
            throw new Error('File di backup non trovato');
        }

        try {
            // Reset completo del database
            console.log('Reset del database...');
            await this.resetDatabase();

            console.log('Avvio ripristino backup...');
            const cmd = this.createRestoreCommand(filePath);
            console.log('Esecuzione comando di ripristino:', cmd);

            await new Promise((resolve, reject) => {
                const env = { ...process.env, PGPASSWORD: config.database.password };
                exec(cmd, { env }, (error, stdout, stderr) => {
                    console.log('STDOUT:', stdout);
                    if (stderr) console.log('STDERR:', stderr);
                    
                    // Accetta il ripristino anche se ci sono errori non critici
                    const isSuccessful = !error || 
                        stderr.includes('errori ignorati durante il ripristino') ||
                        stderr.includes('pg_restore completato');
                    
                    if (isSuccessful) {
                        resolve();
                    } else {
                        console.error('Errore durante il ripristino:', error);
                        reject(error);
                    }
                });
            });

            // Verifica le tabelle ripristinate
            const tablesCheck = await pool.query(`
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename;
            `);

            if (tablesCheck.rows.length === 0) {
                throw new Error('Nessuna tabella trovata dopo il ripristino');
            }

            return {
                success: true,
                message: 'Ripristino completato con successo',
                tablesRestored: tablesCheck.rows.map(row => row.tablename),
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Errore durante il ripristino:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    scheduleBackups() {
        // Esegue il backup ogni giorno alle 3:00
        const job = schedule.scheduleJob('0 3 * * *', async () => {
            console.log('Avvio backup programmato...');
            await this.performBackup();
        });
        
        console.log('Backup programmati configurati');
        return job;
    }

    async listBackups() {
        try {
            const files = await fs.readdir(config.backupDir);
            const backups = await Promise.all(
                files.map(async (file) => {
                    const filePath = path.join(config.backupDir, file);
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