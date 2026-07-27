export type AppRuntime = 'api' | 'worker' | 'scheduler';

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function numberFromEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric environment variable: ${name}`);
  }
  return parsed;
}

function boundedNumberFromEnv(name: string, fallback: number, min: number, max: number) {
  return Math.min(Math.max(numberFromEnv(name, fallback), min), max);
}

export const env = () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: numberFromEnv('PORT', 3002),
  databaseUrl: required('DATABASE_URL'),
  directUrl: process.env.DIRECT_URL,
  redisUrl: required('REDIS_URL', 'redis://localhost:6380'),
  adminApiKey: process.env.ADMIN_API_KEY,
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  dbPoolMax: numberFromEnv('DB_POOL_MAX', 10),
  providerSyncCron: process.env.PROVIDER_SYNC_CRON ?? '*/15 * * * *',
  jobExpirationCron: process.env.JOB_EXPIRATION_CRON ?? '0 * * * *',
  outboxCron: process.env.OUTBOX_CRON ?? '* * * *',
  aiJobFilterEnabled: process.env.AI_JOB_FILTER_ENABLED !== 'false',
  providers: {
    greenhouse: {
      boardToken: process.env.GREENHOUSE_BOARD_TOKEN,
      companyName: process.env.GREENHOUSE_COMPANY_NAME,
      baseUrl: process.env.GREENHOUSE_BASE_URL ?? 'https://boards-api.greenhouse.io/v1/boards',
    },
    arbeitnow: {
      baseUrl: process.env.ARBEITNOW_BASE_URL ?? 'https://www.arbeitnow.com/api/job-board-api',
      pages: boundedNumberFromEnv('ARBEITNOW_PAGES', 3, 1, 10),
    },
    lever: {
      baseUrl: process.env.LEVER_BASE_URL ?? 'https://api.lever.co/v0/postings',
    },
    ashby: {
      baseUrl: process.env.ASHBY_BASE_URL ?? 'https://api.ashbyhq.com/posting-api/job-board',
    },
  },
});

export type EnvConfig = ReturnType<typeof env>;
