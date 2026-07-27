import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SchedulerModule } from './scheduler.module';

async function bootstrap() {
  Logger.log('Bootstrapping Job Service scheduler...');
  await NestFactory.createApplicationContext(SchedulerModule, { bufferLogs: false });
  Logger.log('Job Service scheduler started.');
}

bootstrap().catch((error) => {
  Logger.error(
    `Job Service scheduler failed to start: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
