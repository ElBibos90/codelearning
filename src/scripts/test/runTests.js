import { spawn } from 'child_process';
import colors from 'colors';
import path from 'path';
import { fileURLToPath } from 'url';
import { SERVER_CONFIG } from '../../config/environments.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
    console.log('Avvio dei test...'.cyan);

    try {
        // Prima esegue il setup del database
        console.log('\nEsecuzione setup database di test...'.yellow);
        await runCommand('node', ['src/scripts/test/setupTestDb.js']);
        
        // Poi esegue i test
        console.log('\nEsecuzione test...'.yellow);
        await runCommand('jest', ['--detectOpenHandles', '--forceExit'], {
            env: { NODE_ENV: SERVER_CONFIG.nodeEnv }
        });

        console.log('\n✓ Tutti i test completati con successo'.green);
    } catch (error) {
        console.error('\n✗ Esecuzione test fallita'.red, error);
        process.exit(1);
    }
}

function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, {
            stdio: 'inherit',
            ...options
        });

        proc.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Comando ${command} fallito con codice ${code}`));
            } else {
                resolve();
            }
        });

        proc.on('error', (err) => {
            reject(err);
        });
    });
}

runTests();