#!/usr/bin/env node
require('dotenv/config');

const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');

const port = Number(process.env.PORT ?? 3002);

function log(message) {
  console.log(`[render-start] ${message}`);
}

function fail(message, error) {
  console.error(`[render-start] ${message}`);
  if (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exit(1);
}

function createTemporaryServer() {
  return http.createServer((request, response) => {
    response.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
    response.end(
      JSON.stringify({
        status: 'initializing',
        phase: 'migrating',
        path: request.url,
        timestamp: new Date().toISOString(),
      }),
    );
  });
}

function runMigrations() {
  log('Running Prisma migrations before starting the API.');
  const result = spawnSync(process.execPath, ['scripts/deploy-migrations.js'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Migration process exited with code ${result.status ?? 'unknown'}.`);
  }

  log('Prisma migrations completed successfully.');
}

function startApi() {
  log('Starting Job Service API.');
  const child = spawn(process.execPath, ['dist/src/api.js'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    fail('Failed to start Job Service API.', error);
  });

  child.on('exit', (code, signal) => {
    log(`Job Service API exited with code ${code ?? 'null'} and signal ${signal ?? 'null'}.`);
    process.exit(code ?? 1);
  });

  process.on('SIGTERM', () => child.kill('SIGTERM'));
  process.on('SIGINT', () => child.kill('SIGINT'));
}

const temporaryServer = createTemporaryServer();

temporaryServer.on('error', (error) => {
  fail(`Temporary startup server failed to bind port ${port}.`, error);
});

temporaryServer.listen(port, '0.0.0.0', () => {
  log(`Temporary startup server listening on port ${port}.`);

  try {
    runMigrations();
  } catch (error) {
    temporaryServer.close(() => {
      fail('Startup migration failed. Deployment should stop.', error);
    });
    return;
  }

  temporaryServer.close(() => {
    log('Temporary startup server closed.');
    startApi();
  });
});
