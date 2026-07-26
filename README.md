# AiverseWorld Job Service

Production-oriented NestJS service for job ingestion, canonical job management, search, and admin operations.

## Architecture

This is a modular monolith with three runtime processes from one codebase:

- API: `src/api.ts`
- Worker: `src/worker.ts`
- Scheduler: `src/scheduler.ts`

PostgreSQL is the source of truth. Redis and BullMQ handle background queues. Search currently uses PostgreSQL with full-text and trigram indexes, with `SearchIndexService` as the future adapter boundary for OpenSearch, Typesense, or Meilisearch.

## Local Setup

1. Create `.env` from `.env.example`.
2. Start dependencies:

```powershell
docker compose up postgres redis -d
```

3. Run migrations:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/aiverse_jobs?schema=aiverse_jobs"
$env:DIRECT_URL=$env:DATABASE_URL
npm run prisma:migrate
```

4. Build:

```powershell
npm run build
```

5. Start each runtime:

```powershell
npm run start:api
npm run start:worker
npm run start:scheduler
```

`start`, `start:api`, `start:worker`, `start:prod`, `start:dev`, and `start:dev:worker` run `prisma:migrate:startup` first, matching the AiverseWorld backend startup pattern. The scheduler only needs Redis and does not run migrations because it only enqueues work.

## API

- `GET /health`
- `GET /ready`
- `GET /jobs`
- `GET /jobs/search`
- `GET /jobs/:id`
- `GET /jobs/slug/:slug`
- `GET /companies`
- `GET /companies/:slug`
- `GET /companies/:slug/jobs`
- `GET /admin/providers`
- `GET /admin/ingestion-runs`
- `GET /admin/ingestion-errors`
- `POST /admin/providers/:id/sync`
- `POST /admin/jobs/:id/reindex`

Swagger is available at `/docs`.

## Admin Auth

Admin endpoints require either:

```text
Authorization: Bearer <ADMIN_API_KEY>
```

or:

```text
x-admin-api-key: <ADMIN_API_KEY>
```

## Queues

- `provider-sync`
- `job-normalization`
- `job-indexing`
- `job-expiration`
- `outbox-processing`
- `ai-processing`

The scheduler only enqueues repeatable work. The worker performs provider fetches, normalization, validation, deduplication, transactions, outbox creation, search indexing, and expiration processing.

## Provider Adapter

The first implemented provider is Greenhouse. It requires:

```text
GREENHOUSE_BOARD_TOKEN=stripe
GREENHOUSE_COMPANY_NAME=Stripe
```

Greenhouse public job-board listing uses `GET /v1/boards/{board_token}/jobs?content=true` and does not need an API key. The token is the path segment from a company board URL, for example `https://boards.greenhouse.io/stripe`.

Provider-specific payloads are mapped inside `src/modules/providers/greenhouse`. The rest of the service uses `NormalizedJobInput`.

## Verification

```powershell
npm test
npm run build
```

For e2e/integration work, run Postgres and Redis from Docker Compose first.
