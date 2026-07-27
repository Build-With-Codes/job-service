import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Queue } from 'bullmq';
import { JOB_INDEXING_QUEUE } from '../../queues/queue.constants';
import type { JobIndexingJob } from '../../queues/queue.types';
import { PrismaService } from '../../database/prisma.service';

type OutboxPayload = {
  jobId?: string;
};

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(JOB_INDEXING_QUEUE) private readonly indexingQueue: Queue<JobIndexingJob>,
  ) {}

  async processPending(limit = 100) {
    this.logger.log(`Outbox processing scan starting: limit=${limit}`);
    const events = await this.prisma.db.outboxEvent.findMany({
      where: { processedAt: null },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    this.logger.log(`Outbox pending events found: count=${events.length}`);
    for (const event of events) {
      const payload = event.payload as OutboxPayload;
      if (payload.jobId) {
        this.logger.log(
          `Queueing search indexing from outbox: eventId=${event.id} eventType=${event.eventType} jobId=${payload.jobId}`,
        );
        await this.indexingQueue.add(
          'job-index',
          { jobId: payload.jobId, eventId: event.id },
          { jobId: `job-index-${event.id}` },
        );
      }
      await this.prisma.db.outboxEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date() },
      });
      this.logger.log(`Outbox event marked processed: eventId=${event.id}`);
    }
    this.logger.log(`Outbox processing scan complete: processed=${events.length}`);
    return { processed: events.length };
  }
}
