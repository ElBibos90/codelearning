// src/scripts/maintenance/testAllJobs.js
import { fileURLToPath } from 'url';
import path from 'path';
import colors from 'colors';
import { testDbManager } from '../../utils/testDbManager.js';
import { checkSystemHealth } from './healthCheck.js';
import { performCleanup } from './cleanup.js';
import { createBackup } from '../db/backup.js';
import { checkDatabaseData } from '../validation/dataCheck.js';
import { checkDatabaseSchema } from '../validation/schemaCheck.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAllJobs() {
  console.log('Inizio test di tutti i jobs di manutenzione\n'.cyan);

  const jobs = [
    { 
      name: 'Health Check', 
      fn: async () => await checkSystemHealth(testDbManager) 
    },
    { 
      name: 'Database Backup', 
      fn: async () => await createBackup(testDbManager) 
    },
    { 
      name: 'System Cleanup', 
      fn: async () => await performCleanup(testDbManager) 
    },
    { 
      name: 'Data Validation', 
      fn: async () => await checkDatabaseData(testDbManager) 
    },
    { 
      name: 'Schema Validation', 
      fn: async () => await checkDatabaseSchema(testDbManager) 
    }
  ];

  try {
    for (const job of jobs) {
      console.log(`\nEsecuzione ${job.name}...`.yellow);
      console.log('='.repeat(50).gray);
      
      try {
        const startTime = Date.now();
        await job.fn();
        const duration = (Date.now() - startTime) / 1000;
        
        console.log(`\n✓ ${job.name} completato con successo in ${duration}s`.green);
      } catch (error) {
        console.error(`\n✗ Errore in ${job.name}:`.red);
        console.error(error);
      }
      
      console.log('='.repeat(50).gray);
    }
  } finally {
    await testDbManager.end();
  }
}

// Esegui i test
testAllJobs()
  .then(() => {
    console.log('\n✓ Test di tutti i jobs completato'.green);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n✗ Test fallito:'.red, error);
    process.exit(1);
  });