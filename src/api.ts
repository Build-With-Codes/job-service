import 'reflect-metadata';
import compression from 'compression';
import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { EnvConfig } from './config/env';
import { AppModule } from './app.module';

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

  const port = config.get('port', { infer: true });
  await app.listen(port);
  Logger.log(`Job Service API listening on ${port}`);
}

bootstrap().catch((error) => {
  Logger.error(
    `Job Service API failed to start: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
