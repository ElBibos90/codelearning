# CodeLearning Platform

Backend API for the CodeLearning educational platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Setup test database
npm run test:setup

# Run tests
npm test

# Start development server
npm run dev
```

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/codelearning
DB_USER=postgres
DB_HOST=localhost
DB_NAME=codelearning
DB_PASSWORD=password
DB_PORT=5432

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=24h

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/auth.test.js
```

## 📦 Available Scripts

- `npm run dev`: Start development server
- `npm test`: Run tests
- `npm run test:coverage`: Run tests with coverage
- `npm run test:setup`: Setup test database
- `npm run db:migrate`: Run database migrations
- `npm run db:backup`: Create database backup

## 🛠️ Technologies

- Node.js
- Express
- PostgreSQL
- Redis
- Jest
- Swagger

## 📚 API Documentation

When running in development mode, API documentation is available at:
`http://localhost:5000/api-docs`

## 🔐 Security Features

- JWT Authentication
- Rate Limiting
- Input Validation
- SQL Injection Protection
- XSS Protection

## 🤝 Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Create a pull request

## 📄 License

MIT License