# Aparto Backend

Backend API for Aparto - Apartment Accessories Ecommerce Platform.

## Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis
- **Queue:** BullMQ
- **Authentication:** Better Auth + JWT
- **Validation:** class-validator + class-transformer
- **Storage:** Cloudflare R2 (S3-compatible)

## Getting Started

### Prerequisites

- Node.js 18+ LTS
- npm 9+
- PostgreSQL 14+
- Redis 6+

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration

# Setup database
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

### Development

```bash
# Run development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm test

# Run linting
npm run lint

# Prisma Studio
npm run prisma:studio
```

## Project Structure

```
src/
├── common/          # Common utilities (decorators, guards, pipes)
├── config/          # Configuration files
├── modules/         # Feature modules (auth, products, orders, etc.)
├── database/        # Prisma schema and migrations
└── shared/          # Shared types, constants, utils
```

## Environment Variables

See `.env.example` for required environment variables.

## Deployment

This project is configured for automatic deployment to Railway via GitHub Actions.

- **Production:** Push to `main` branch
- **Staging:** Push to `develop` branch

## API Documentation

API documentation will be available via Swagger at `/api` when running.

## License

Copyright © 2026 Neurosoftic
