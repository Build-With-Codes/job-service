import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../config/env';
import { QUEUE_NAMES } from './queue.constants';

function redisConnectionFromUrl(raw: string) {
  const url = new URL(raw);
  const isTls = url.protocol === 'rediss:';
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : 0,
    tls: isTls ? {} : undefined,
    maxRetriesPerRequest: null,
    connectTimeout: 5_000,
  };
}

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>) => {
        const redisUrl = config.get('redisUrl', { infer: true });
        const connection = redisConnectionFromUrl(redisUrl);
        new Logger(QueueModule.name).log(
          `Configuring BullMQ Redis connection: host=${connection.host} port=${connection.port} db=${connection.db}`,
        );
        return {
          connection,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5_000,
            },
            removeOnComplete: 500,
            removeOnFail: 1_000,
          },
        };
      },
    }),
    BullModule.registerQueue(...QUEUE_NAMES.map((name) => ({ name }))),
  ],
  exports: [BullModule],
})
export class QueueModule {}
