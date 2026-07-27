import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/configuration.module';
import { StructuredLoggerModule } from './common/logging/logger.module';
import { QueueModule } from './queues/queue.module';
import { IngestionScheduler } from './modules/ingestion/ingestion.scheduler';
import { PromptsModule } from './modules/prompts/prompts.module';
import { PromptsScheduler } from './modules/prompts/prompts.scheduler';

@Module({
  imports: [ConfigurationModule, StructuredLoggerModule, QueueModule, PromptsModule],
  providers: [IngestionScheduler, PromptsScheduler],
})
export class SchedulerModule {}
