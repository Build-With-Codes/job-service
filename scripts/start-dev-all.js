require('dotenv/config');

const net = require('node:net');
const { spawn } = require('node:child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const useShell = process.platform === 'win32';
const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6380');

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 2500 });
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => resolve(false));
  });
}

function run(label, args) {
  console.log(`[${label}] launching: npm ${args.join(' ')}`);
  const child = spawn(npmCommand, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: useShell,
  });

  const writePrefixed = (stream, chunk) => {
    const text = chunk.toString();
    for (const line of text.split(/\r?\n/)) {
      if (line.length > 0) {
        stream.write(`[${label}] ${line}\n`);
      }
    }
  };

  child.stdout.on('data', (chunk) => {
    writePrefixed(process.stdout, chunk);
  });
  child.stderr.on('data', (chunk) => {
    writePrefixed(process.stderr, chunk);
  });
  child.on('exit', (code) => {
    console.log(`[${label}] exited with code ${code}`);
  });
  child.on('error', (error) => {
    console.error(`[${label}] failed to start: ${error.message}`);
  });
  return child;
}

async function main() {
  const redisHost = redisUrl.hostname || 'localhost';
  const redisPort = Number(redisUrl.port || 6379);
  const redisReady = await checkPort(redisHost, redisPort);

  if (!redisReady) {
    console.error(
      `Redis is not reachable at ${redisHost}:${redisPort}. Start Redis first or update REDIS_URL in .env.`,
    );
    console.error('For Docker Compose Redis, run: docker compose up redis -d');
    process.exit(1);
  }

  console.log('Running startup migrations before launching local runtimes...');
  const migrate = spawn(npmCommand, ['run', 'prisma:migrate:startup'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: useShell,
  });

  migrate.on('error', (error) => {
    console.error(`Failed to start migration command: ${error.message}`);
    process.exit(1);
  });

  migrate.on('exit', (code) => {
    if (code !== 0) {
      process.exit(code ?? 1);
    }

    const children = [run('api', ['run', 'dev:api'])];

    if (process.env.QUEUE_WORKERS_ENABLED === 'false') {
      console.log('[worker] skipped because QUEUE_WORKERS_ENABLED=false');
    } else {
      children.push(run('worker', ['run', 'dev:worker']));
    }

    if (process.env.BULL_SCHEDULER_ENABLED === 'false') {
      console.log('[scheduler] skipped because BULL_SCHEDULER_ENABLED=false');
    } else {
      children.push(run('scheduler', ['run', 'dev:scheduler']));
    }

    const stop = () => {
      for (const child of children) {
        child.kill('SIGTERM');
      }
      process.exit(0);
    };

    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  });
}

void main();
