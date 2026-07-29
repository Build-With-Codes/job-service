import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/configuration.module';
import { StructuredLoggerModule } from './common/logging/logger.module';
import { QueueModule } from './queues/queue.module';
import { IngestionScheduler } from './modules/ingestion/ingestion.scheduler';
import { PromptsModule } from './modules/prompts/prompts.module';
import { PromptsScheduler } from './modules/prompts/prompts.scheduler';

const bullSchedulerEnabled = process.env.BULL_SCHEDULER_ENABLED !== 'false';
const schedulerImports = bullSchedulerEnabled
  ? [ConfigurationModule, StructuredLoggerModule, QueueModule, PromptsModule]
  : [ConfigurationModule, StructuredLoggerModule, PromptsModule];
const schedulerProviders = bullSchedulerEnabled
  ? [IngestionScheduler, PromptsScheduler]
  : [PromptsScheduler];

@Module({
  imports: schedulerImports,
  providers: schedulerProviders,
})
export class SchedulerModule {}
