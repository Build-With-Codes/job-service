import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

function isRedisRequestLimitError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('ERR max requests limit exceeded');
}

function stopWorkerForRedisQuota(error: unknown) {
  if (!isRedisRequestLimitError(error)) {
    return false;
  }

  Logger.error(
    'Redis request quota exhausted. Stopping worker to avoid burning additional Upstash requests. Set QUEUE_WORKERS_ENABLED=false until quota resets or Redis is upgraded.',
  );
  process.exit(0);
}

process.on('uncaughtException', (error) => {
  if (stopWorkerForRedisQuota(error)) return;
  Logger.error(`Uncaught worker exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  if (stopWorkerForRedisQuota(reason)) return;
  Logger.error(`Unhandled worker rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  process.exit(1);
});

async function bootstrap() {
  Logger.log('Bootstrapping Job Service worker...');
  await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: false });
  Logger.log('Job Service worker started.');
}

bootstrap().catch((error) => {
  Logger.error(
    `Job Service worker failed to start: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
