#!/usr/bin/env node
require('dotenv/config');

const { spawn } = require('node:child_process');

const children = new Map();
const criticalRuntimes = new Set(
  (process.env.CRITICAL_BACKGROUND_RUNTIMES ?? 'worker,scheduler')
    .split(',')
    .map((runtime) => runtime.trim())
    .filter(Boolean),
);

function log(label, message) {
  console.log(`[${label}] ${message}`);
}

function runMigrations() {
  log('migrate', 'running Prisma migrations before starting background runtimes');
  const child = spawn(process.execPath, ['scripts/deploy-migrations.js'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  children.set('migrate', child);

  const writePrefixed = (stream, chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line) stream.write(`[migrate] ${line}\n`);
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

function spawnRuntime(label, args) {
  log(label, `launching: ${process.execPath} ${args.join(' ')}`);
  const child = spawn(process.execPath, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  children.set(label, child);

  const writePrefixed = (stream, chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line) stream.write(`[${label}] ${line}\n`);
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

async function main() {
  try {
    await runMigrations();
  } catch (error) {
    console.error(`[background] startup migration failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  if (process.env.QUEUE_WORKERS_ENABLED === 'false') {
    log('worker', 'skipped because QUEUE_WORKERS_ENABLED=false');
  } else {
    spawnRuntime('worker', ['dist/src/worker.js']);
  }

  if (process.env.BULL_SCHEDULER_ENABLED === 'false') {
    log('scheduler', 'skipped because BULL_SCHEDULER_ENABLED=false');
  } else {
    spawnRuntime('scheduler', ['dist/src/scheduler.js']);
  }
}

void main();
