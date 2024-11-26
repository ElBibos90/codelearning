// tests/teardown.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { rimraf } from 'rimraf'; // Aggiungi questa dipendenza: npm install rimraf

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async () => {
    const logDir = path.join(__dirname, '../logs');
    
    try {
        // Aspetta che tutti gli handle dei file siano chiusi
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Usa rimraf per forzare la rimozione della directory e del suo contenuto
        await rimraf(logDir);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.warn('Warning: Error in test teardown:', err.message);
        }
    }
};