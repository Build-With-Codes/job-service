import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { QueueModule } from '../../queues/queue.module';
import { DeduplicationModule } from '../deduplication/deduplication.module';
import { NormalizationModule } from '../normalization/normalization.module';
import { ProvidersModule } from '../providers/providers.module';
import { IngestionRunService } from './ingestion-run.service';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [PrismaModule, QueueModule, ProvidersModule, NormalizationModule, DeduplicationModule],
  providers: [IngestionService, IngestionRunService],
  exports: [IngestionService, IngestionRunService],
})
export class IngestionModule {}
