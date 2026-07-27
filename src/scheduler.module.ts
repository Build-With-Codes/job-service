import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/configuration.module';
import { StructuredLoggerModule } from './common/logging/logger.module';
import { QueueModule } from './queues/queue.module';
import { IngestionScheduler } from './modules/ingestion/ingestion.scheduler';

@Module({
  imports: [ConfigurationModule, StructuredLoggerModule, QueueModule],
  providers: [IngestionScheduler],
})
export class SchedulerModule {}
