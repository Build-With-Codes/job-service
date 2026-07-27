#!/usr/bin/env node
require('dotenv/config');

const { spawn } = require('node:child_process');

const children = new Map();

function log(label, message) {
  console.log(`[${label}] ${message}`);
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
    if (code !== 0 && !stopping) {
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

spawnRuntime('api', process.execPath, ['scripts/start-render.js']);
spawnRuntime('worker', process.execPath, ['dist/src/worker.js']);
spawnRuntime('scheduler', process.execPath, ['dist/src/scheduler.js']);
