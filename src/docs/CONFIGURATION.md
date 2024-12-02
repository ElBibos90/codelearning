# CodeLearning - Configurazione

Questo documento descrive in dettaglio le configurazioni disponibili per il backend di CodeLearning.

## 🔧 File di Configurazione

Le configurazioni sono gestite attraverso variabili d'ambiente e centralizzate nel file `src/config/environments.js`. Per ogni ambiente (development, production, test) è presente un file `.env` specifico.

### File .env Supportati

- `.env` - Configurazione di default/development
- `.env.test` - Configurazione per i test
- `.env.production` - Configurazione di produzione

## ⚙️ Configurazioni Disponibili

### Server (SERVER_CONFIG)
```env
PORT=5000                          # Porta del server
NODE_ENV=development              # Ambiente (development/production/test)
FRONTEND_URL=http://localhost:3000 # URL del frontend

Database (DB_CONFIG)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DB_USER=postgres
DB_HOST=localhost
DB_NAME=codelearning
DB_PASSWORD=your_password
DB_PORT=5432

Redis (REDIS_CONFIG)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

JWT (JWT_CONFIG)
JWT_SECRET=your_secret_key
JWT_EXPIRE=24h

Sicurezza (SECURITY_CONFIG)
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW=60
AUTH_RATE_LIMIT_MAX=5
ADMIN_RATE_LIMIT_WINDOW=15
ADMIN_RATE_LIMIT_MAX=30

Backup (BACKUP_CONFIG)
POSTGRESQL_BIN=C:\Program Files\PostgreSQL\17\bin
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=7

CORS (CORS_CONFIG)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

🔍 Validazione delle Configurazioni
Le configurazioni vengono validate all'avvio dell'applicazione. In caso di configurazioni mancanti o non valide, l'applicazione non si avvierà e mostrerà un errore dettagliato.

🚀 Utilizzo in Ambienti Diversi
Development
Usa .env
npm run dev

Test
Usa .env.test
npm test

Production
Usa .env.production
NODE_ENV=production npm start