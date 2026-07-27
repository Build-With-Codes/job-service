require('dotenv/config');

const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { Client } = require('pg');

const SCHEMA_NAME = 'aiverse_jobs';
const ALLOW_UNREACHABLE =
  process.argv.includes('--allow-unreachable') &&
  process.env.ALLOW_UNREACHABLE_MIGRATIONS === 'true';
const REACHABILITY_ERROR_CODES = ['P1001', 'P1002'];
const MIGRATION_TIMEOUT_MS = process.env.DB_MIGRATION_TIMEOUT_MS
  ? Number(process.env.DB_MIGRATION_TIMEOUT_MS)
  : undefined;

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
  {
    name: '20260727153000_prompt_workspace',
    tables: [
      'Prompt',
      'PromptVersion',
      'PromptCategory',
      'PromptTag',
      'PromptSource',
      'PromptEmbedding',
      'PromptStat',
      'PromptFavorite',
      'PromptCollection',
      'PromptCollectionPrompt',
      'PromptCrawlLog',
    ],
  },
  {
    name: '20260727170000_prompt_events',
    tables: ['PromptEvent'],
  },
];

function withSchema(raw) {
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    url.searchParams.set('schema', SCHEMA_NAME);
    return url.toString();
  } catch {
    return raw;
  }
}

function isLikelyPoolerUrl(raw) {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return url.hostname.includes('pooler.supabase.com') || url.port === '6543';
  } catch {
    return raw.includes('pooler.supabase.com') || raw.includes(':6543');
  }
}

function describeDatabaseTarget(raw) {
  try {
    const url = new URL(raw);
    const schema = url.searchParams.get('schema') ?? SCHEMA_NAME;
    const user = url.username ? `${url.username}@` : '';
    return `${user}${url.hostname}:${url.port || 'default'} schema=${schema}`;
  } catch {
    return 'unparseable connection string';
  }
}

function getDatabaseUrl() {
  const directUrl = process.env.DIRECT_URL ?? process.env.DIRECT_DATABASE_URL;
  const raw = directUrl ?? process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DIRECT_URL or DATABASE_URL is required to deploy Prisma migrations.');
  }

  if (!directUrl && isLikelyPoolerUrl(raw)) {
    throw new Error(
      [
        'Prisma migrations cannot run through the Supabase pooler connection.',
        'Set DIRECT_URL or DIRECT_DATABASE_URL to the direct PostgreSQL connection string for migrations.',
        'Keep DATABASE_URL as the pooled runtime connection if needed.',
        `Detected migration fallback target: ${describeDatabaseTarget(raw)}`,
      ].join(' '),
    );
  }

  return withSchema(raw);
}

function runPrisma(args, options = {}) {
  const migrationUrl = getDatabaseUrl();
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

  return spawnSync(spawnCommand, spawnArgs, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: withSchema(process.env.DATABASE_URL),
      DIRECT_URL: migrationUrl,
    },
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    ...(MIGRATION_TIMEOUT_MS ? { timeout: MIGRATION_TIMEOUT_MS } : {}),
  });
}

function assertSuccess(result, label) {
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

function isReachabilityError(output) {
  return (
    REACHABILITY_ERROR_CODES.some((code) => output.includes(code)) ||
    output.includes('ETIMEDOUT') ||
    output.includes('ECONNREFUSED') ||
    output.includes('ENOTFOUND')
  );
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

async function verifyRequiredTables() {
  const existingTables = await getExistingTables(getDatabaseUrl());
  const requiredTables = new Set(BASELINE_MIGRATIONS.flatMap((migration) => migration.tables));
  const missingTables = [...requiredTables].filter((table) => !existingTables.has(table));

  if (missingTables.length > 0) {
    throw new Error(
      `Migration finished, but required tables are still missing in schema "${SCHEMA_NAME}": ${missingTables.join(', ')}`,
    );
  }

  console.log(
    `Verified ${requiredTables.size} required table(s) in schema "${SCHEMA_NAME}".`,
  );
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
  console.log(`Migration target: ${describeDatabaseTarget(getDatabaseUrl())}`);
  const firstDeploy = runPrisma(['migrate', 'deploy'], { capture: true });

  const output = `${firstDeploy.stdout ?? ''}${firstDeploy.stderr ?? ''}`;

  if (firstDeploy.error) {
    const errorOutput = `${output}\n${firstDeploy.error.code ?? ''} ${firstDeploy.error.message ?? ''}`;
    if (warnAndAllowUnreachable(errorOutput)) return;
    throw firstDeploy.error;
  }

  if (firstDeploy.status === 0) {
    process.stdout.write(firstDeploy.stdout ?? '');
    process.stderr.write(firstDeploy.stderr ?? '');
    await verifyRequiredTables();
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
  await verifyRequiredTables();
}

main().catch((error) => {
  console.error('Fatal Migration Failure:', error instanceof Error ? error.message : error);
  process.exit(1);
});
