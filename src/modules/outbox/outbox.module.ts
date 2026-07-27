import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { QueueModule } from '../../queues/queue.module';
import { SearchModule } from '../search/search.module';
import { OutboxService } from './outbox.service';
import { JobIndexingWorker, OutboxWorker } from './outbox.worker';

@Module({
  imports: [PrismaModule, QueueModule, SearchModule],
  providers: [OutboxService, OutboxWorker, JobIndexingWorker],
  exports: [OutboxService],
})
export class OutboxModule {}
