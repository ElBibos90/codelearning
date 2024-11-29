// tests/teardown.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { rimraf } from 'rimraf'; // Assicurati di aver installato: npm install rimraf

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async () => {
    const logDir = path.join(__dirname, '../logs');

    try {
        // Attendi che tutti gli handle dei file siano chiusi (aggiunto per sicurezza)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Forza la chiusura dei file aperti in Windows (problemi di EPERM)
        if (process.platform === 'win32') {
            const files = await fs.readdir(logDir);
            for (const file of files) {
                try {
                    const filePath = path.join(logDir, file);
                    await fs.truncate(filePath); // Svuota il contenuto del file
                    await fs.rm(filePath);      // Rimuovi il file
                } catch (err) {
                    console.warn(`Warning: Could not clean file ${file}:`, err.message);
                }
            }
        }

        // Usa rimraf per forzare la rimozione della directory e del suo contenuto
        await rimraf(logDir);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.warn('Warning: Error in test teardown:', err.message);
        }
    }
};
