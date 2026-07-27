require('dotenv/config');

const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { Client } = require('pg');

const SCHEMA_NAME = 'aiverse_jobs';
const ALLOW_UNREACHABLE =
  process.argv.includes('--allow-unreachable') &&
  process.env.ALLOW_UNREACHABLE_MIGRATIONS !== 'false';
const REACHABILITY_ERROR_CODES = ['P1001', 'P1002', 'ETIMEDOUT'];

const BASELINE_MIGRATIONS = [
  {
    name: '20260726000000_init',
    tables: [
      'Provider',
      'Company',
      'Job',
      'JobSource',
      'JobLocation',
      'Skill',
      'JobSkill',
      'IngestionRun',
      'IngestionError',
      'OutboxEvent',
    ],
  },
];

function withSchema(raw) {
  if (!raw) return raw;
  const url = new URL(raw);
  url.searchParams.set('schema', SCHEMA_NAME);
  return url.toString();
}

function getDatabaseUrl() {
  const raw = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DIRECT_URL or DATABASE_URL is required to deploy Prisma migrations.');
  }
  return withSchema(raw);
}

function getMigrationUrlCandidates() {
  const candidates = [process.env.DIRECT_URL, process.env.DATABASE_URL]
    .filter(Boolean)
    .map((url) => withSchema(url));
  return [...new Set(candidates)];
}

function runPrisma(args, options = {}) {
  const timeoutMs = Number(process.env.PRISMA_MIGRATION_TIMEOUT_MS ?? 90_000);
  const databaseUrl = options.databaseUrl ?? getDatabaseUrl();
  const command = path.join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
  );
  const spawnCommand = process.platform === 'win32' ? 'cmd.exe' : command;
  const spawnArgs =
    process.platform === 'win32'
      ? ['/d', '/c', ['call', command, ...args].join(' ')]
      : args;

  console.log(`Running Prisma command: prisma ${args.join(' ')}`);

  return spawnSync(spawnCommand, spawnArgs, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
    },
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    timeout: timeoutMs,
  });
}

function assertSuccess(result, label) {
  if (result.error) {
    const message = `${result.error.code ?? ''} ${result.error.message ?? result.error}`.trim();
    if (warnAndAllowUnreachable(message)) return;
    throw result.error;
  }
  if (result.signal === 'SIGTERM' && result.status === null) {
    if (warnAndAllowUnreachable('ETIMEDOUT')) return;
    throw new Error(`${label} timed out. Increase PRISMA_MIGRATION_TIMEOUT_MS if the database is slow.`);
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

function isReachabilityError(output) {
  return REACHABILITY_ERROR_CODES.some((code) => output.includes(code));
}

function warnAndAllowUnreachable(output) {
  if (!ALLOW_UNREACHABLE || !isReachabilityError(output)) return false;
  console.warn(
    'Prisma migration database is unreachable. Continuing startup because ALLOW_UNREACHABLE_MIGRATIONS=true.',
  );
  console.warn('Fix DATABASE_URL/DIRECT_URL or run migrations from an authorized network node.');
  return true;
}

async function getExistingTables(databaseUrl) {
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: Number(process.env.DB_MIGRATION_CONNECT_TIMEOUT_MS ?? 10_000),
  });
  await client.connect();
  try {
    const result = await client.query(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1
          AND table_type = 'BASE TABLE'
      `,
      [SCHEMA_NAME],
    );
    return new Set(result.rows.map((row) => row.table_name));
  } finally {
    await client.end();
  }
}

function getMigrationsToBaseline(existingTables) {
  return BASELINE_MIGRATIONS.filter((migration) => {
    const missingTables = migration.tables.filter((table) => !existingTables.has(table));
    if (missingTables.length > 0) {
      console.log(`Migration ${migration.name} missing tables: ${missingTables.join(', ')}`);
      return false;
    }
    return true;
  }).map((migration) => migration.name);
}

async function baselineExistingDatabase() {
  const existingTables = await getExistingTables(getDatabaseUrl());
  const migrations = getMigrationsToBaseline(existingTables);

  if (migrations.length === 0) {
    throw new Error(
      `Prisma reported a non-empty schema, but no known baseline tables were found in schema "${SCHEMA_NAME}".`,
    );
  }

  console.log(`Baselining schema "${SCHEMA_NAME}" with ${migrations.length} verified migration(s).`);
  for (const migration of migrations) {
    console.log(`Marking migration as applied: ${migration}`);
    assertSuccess(
      runPrisma(['migrate', 'resolve', '--applied', migration]),
      `prisma migrate resolve --applied ${migration}`,
    );
  }
}

async function main() {
  console.log(`Initiating ${SCHEMA_NAME} database deployment check cycle...`);
  const urls = getMigrationUrlCandidates();
  let firstDeploy;
  let output = '';

  for (const [index, databaseUrl] of urls.entries()) {
    firstDeploy = runPrisma(['migrate', 'deploy'], { capture: true, databaseUrl });
    output = `${firstDeploy.stdout ?? ''}${firstDeploy.stderr ?? ''}`;

    if (!firstDeploy.error) break;

    const message = `${firstDeploy.error.code ?? ''} ${firstDeploy.error.message ?? firstDeploy.error}`.trim();
    const hasFallback = index < urls.length - 1;

    if (hasFallback && isReachabilityError(message)) {
      console.warn('Prisma migration connection failed for DIRECT_URL. Retrying with DATABASE_URL...');
      continue;
    }

    if (warnAndAllowUnreachable(message)) return;
    throw firstDeploy.error;
  }

  if (firstDeploy.signal === 'SIGTERM' && firstDeploy.status === null) {
    if (warnAndAllowUnreachable('ETIMEDOUT')) return;
    throw new Error('prisma migrate deploy timed out. Check DATABASE_URL/DIRECT_URL network access or increase PRISMA_MIGRATION_TIMEOUT_MS.');
  }

  if (firstDeploy.status === 0) {
    process.stdout.write(firstDeploy.stdout ?? '');
    process.stderr.write(firstDeploy.stderr ?? '');
    console.log('Database schema successfully checked and synchronized.');
    return;
  }

  if (!output.includes('P3005')) {
    process.stdout.write(firstDeploy.stdout ?? '');
    process.stderr.write(firstDeploy.stderr ?? '');
    if (warnAndAllowUnreachable(output)) return;
    process.exit(firstDeploy.status ?? 1);
  }

  console.warn(
    'Prisma found a non-empty target database without migration history metadata. Initiating automatic baseline handler.',
  );
  await baselineExistingDatabase();
  console.log('Executing final catch-up migration deployment...');
  assertSuccess(runPrisma(['migrate', 'deploy']), 'prisma migrate deploy');
}

main().catch((error) => {
  console.error('Fatal Migration Failure:', error instanceof Error ? error.message : error);
  process.exit(1);
});
