# SoilFLO Dispatch API

REST API for managing construction site material dispatch tickets.

## Requirements

- Node.js 18+
- npm

## Setup

```bash
npm install
npm run setup      # creates database, runs migrations, seeds 100k sites + 1k trucks
npm run start:dev  # server on http://localhost:3000
```

`npm run setup` handles everything sequentially. The steps can also be run individually:
```bash
npm run env:init                     # copy .env.example → .env (skips if .env already exists)
npx prisma migrate dev --name init   # create database and apply schema
npm run db:seed                      # populate sites and trucks
```

To reset the database and re-seed from scratch:
```bash
npm run db:reset
```

## API Documentation

Interactive Swagger UI: http://localhost:3000/api/docs

All endpoints are prefixed `/api/v1`.

## Tests

```bash
npm test           # unit tests
npm run test:cov   # with coverage report
```

## Notes

- SQLite was chosen so reviewers need no database server to run this locally.
- The database file (`dev.db`) is excluded from version control and created fresh on first `npm run setup`.
- Engineering observations — constraints noticed during implementation that were intentionally left out of scope — are documented in [OBSERVATIONS.md](./OBSERVATIONS.md).

## Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/tickets/bulk` | Create tickets in bulk for a truck |
| `GET` | `/api/v1/tickets` | List tickets — filterable by site and date range |
| `GET` | `/api/v1/health` | Health check |
