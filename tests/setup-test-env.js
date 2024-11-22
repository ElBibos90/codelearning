// tests/setup-test-env.js

import dotenv from 'dotenv';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica le variabili d'ambiente di test
dotenv.config({ 
  path: path.resolve(__dirname, '../.env.test')
});

// Configurazione globale per i test
global.console.error = jest.fn();
global.console.warn = jest.fn();

// Setup per gestire le promise non gestite nei test
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Non terminare il processo nei test
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
});

// Pulizia dei mock dopo ogni test
afterEach(() => {
  jest.clearAllMocks();
});

// Aggiungiamo un test base per l'ambiente di test
describe('Test Environment', () => {
  it('should have correct test environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DATABASE_URL).toBeDefined();
  });

  it('should mock console.error and console.warn', () => {
    expect(global.console.error).toEqual(expect.any(Function));
    expect(global.console.warn).toEqual(expect.any(Function));
  });
});