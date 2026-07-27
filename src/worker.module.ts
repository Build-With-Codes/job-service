import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/configuration.module';
import { StructuredLoggerModule } from './common/logging/logger.module';
import { PrismaModule } from './database/prisma.module';
import { QueueModule } from './queues/queue.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { NormalizationModule } from './modules/normalization/normalization.module';
import { DeduplicationModule } from './modules/deduplication/deduplication.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { JobExpirationWorker, ProviderSyncWorker } from './modules/ingestion/ingestion.worker';
import { OutboxModule } from './modules/outbox/outbox.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigurationModule,
    StructuredLoggerModule,
    PrismaModule,
    QueueModule,
    ProvidersModule,
    NormalizationModule,
    DeduplicationModule,
    SearchModule,
    IngestionModule,
    OutboxModule,
  ],
  providers: [ProviderSyncWorker, JobExpirationWorker],
})
export class WorkerModule {}
