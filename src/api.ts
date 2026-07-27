import 'reflect-metadata';
import compression from 'compression';
import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createServer } from 'node:net';
import type { EnvConfig } from './config/env';
import { AppModule } from './app.module';

const bootstrapLogger = new Logger('Bootstrap');

async function findAvailablePort(preferredPort: number) {
  if (process.env.RENDER === 'true' || process.env.NODE_ENV === 'production') {
    return preferredPort;
  }

  const fallbackEnabled =
    process.env.PORT_FALLBACK !== 'false' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.RENDER !== 'true';
  const maxAttempts = fallbackEnabled ? 10 : 1;

  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidatePort = preferredPort + offset;
    const available = await new Promise<boolean>((resolve) => {
      const server = createServer();

      server.once('error', () => {
        resolve(false);
      });

      server.once('listening', () => {
        server.close(() => resolve(true));
      });

      server.listen(candidatePort, '0.0.0.0');
    });

    if (available) {
      return candidatePort;
    }
  }

  throw new Error(
    `No available port found starting from ${preferredPort}. Set PORT to a free port or stop the process using it.`,
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<EnvConfig, true>);
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: config.get('corsOrigins', { infer: true }),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('AiverseWorld Job Service')
      .setDescription('Production-oriented job ingestion, search, and admin API.')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('/docs', app, document);

  const preferredPort = config.get('port', { infer: true });
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort && process.env.RENDER !== 'true' && process.env.NODE_ENV !== 'production') {
    bootstrapLogger.warn(
      `Port ${preferredPort} is busy. Starting job service on fallback port ${port}. Set PORT to override or free the original port.`,
    );
  }

  await app.listen(port, '0.0.0.0');
  bootstrapLogger.log(`Job Service API listening on ${port}`);
}

bootstrap().catch((error) => {
  Logger.error(
    `Job Service API failed to start: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
