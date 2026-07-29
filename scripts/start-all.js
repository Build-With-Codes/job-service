#!/usr/bin/env node
require('dotenv/config');

const http = require('node:http');
const { spawn } = require('node:child_process');

const children = new Map();
const port = Number(process.env.PORT ?? 3002);
const criticalRuntimes = new Set(
  (process.env.CRITICAL_RUNTIMES ?? 'api')
    .split(',')
    .map((runtime) => runtime.trim())
    .filter(Boolean),
);

function log(label, message) {
  console.log(`[${label}] ${message}`);
}

function fail(message, error) {
  console.error(`[start-all] ${message}`);
  if (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }
  stopAll(1);
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
  log('migrate', 'running Prisma migrations before starting runtimes');
  const child = spawn(process.execPath, ['scripts/deploy-migrations.js'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  children.set('migrate', child);

  const writePrefixed = (stream, chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line) {
        stream.write(`[migrate] ${line}\n`);
      }
    }
  };

  child.stdout.on('data', (chunk) => writePrefixed(process.stdout, chunk));
  child.stderr.on('data', (chunk) => writePrefixed(process.stderr, chunk));

  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      children.delete('migrate');
      if (code === 0) {
        log('migrate', 'completed successfully');
        resolve();
        return;
      }

      reject(new Error(`Migration exited with code ${code ?? 'null'} and signal ${signal ?? 'null'}.`));
    });
  });
}

function spawnRuntime(label, command, args) {
  log(label, `launching: ${command} ${args.join(' ')}`);
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  children.set(label, child);

  const writePrefixed = (stream, chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line) {
        stream.write(`[${label}] ${line}\n`);
      }
    }
  };

  child.stdout.on('data', (chunk) => writePrefixed(process.stdout, chunk));
  child.stderr.on('data', (chunk) => writePrefixed(process.stderr, chunk));

  child.on('error', (error) => {
    console.error(`[${label}] failed to start: ${error.message}`);
    stopAll(1);
  });

  child.on('exit', (code, signal) => {
    children.delete(label);
    console.log(`[${label}] exited with code ${code ?? 'null'} and signal ${signal ?? 'null'}`);
    if (code !== 0 && criticalRuntimes.has(label) && !stopping) {
      stopAll(code ?? 1);
    }
  });

  return child;
}

let stopping = false;

function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;

  for (const [label, child] of children) {
    log(label, 'stopping');
    child.kill('SIGTERM');
  }

  setTimeout(() => process.exit(exitCode), 5_000).unref();
}

process.on('SIGTERM', () => stopAll(0));
process.on('SIGINT', () => stopAll(0));

const temporaryServer = createTemporaryServer();

temporaryServer.on('error', (error) => {
  fail(`Temporary startup server failed to bind port ${port}.`, error);
});

temporaryServer.listen(port, '0.0.0.0', async () => {
  log('start-all', `temporary startup server listening on port ${port}`);

  try {
    await runMigrations();
  } catch (error) {
    temporaryServer.close(() => {
      fail('startup migration failed; runtimes were not launched', error);
    });
    return;
  }

  temporaryServer.close(() => {
    log('start-all', 'temporary startup server closed; launching API, worker, and scheduler');
    spawnRuntime('api', process.execPath, ['dist/src/api.js']);
    if (process.env.QUEUE_WORKERS_ENABLED === 'false') {
      log('worker', 'skipped because QUEUE_WORKERS_ENABLED=false');
    } else {
      spawnRuntime('worker', process.execPath, ['dist/src/worker.js']);
    }
    if (process.env.BULL_SCHEDULER_ENABLED === 'false') {
      log('scheduler', 'skipped because BULL_SCHEDULER_ENABLED=false');
    } else {
      spawnRuntime('scheduler', process.execPath, ['dist/src/scheduler.js']);
    }
  });
});
