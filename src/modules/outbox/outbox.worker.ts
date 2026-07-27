import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { JOB_INDEXING_QUEUE, OUTBOX_PROCESSING_QUEUE } from '../../queues/queue.constants';
import type { JobIndexingJob, OutboxProcessingJob } from '../../queues/queue.types';
import { SearchIndexService } from '../search/search-index.service';
import { OutboxService } from './outbox.service';

@Processor(OUTBOX_PROCESSING_QUEUE, { concurrency: 1 })
export class OutboxWorker extends WorkerHost {
  private readonly logger = new Logger(OutboxWorker.name);

  constructor(private readonly outbox: OutboxService) {
    super();
  }

  async process(job: Job<OutboxProcessingJob>) {
    this.logger.log(`Outbox worker received job: jobId=${job.id} requestedBy=${job.data.requestedBy}`);
    const result = await this.outbox.processPending();
    this.logger.log(`Outbox worker completed job: jobId=${job.id} result=${JSON.stringify(result)}`);
    return result;
  }
}

@Processor(JOB_INDEXING_QUEUE, { concurrency: 4 })
export class JobIndexingWorker extends WorkerHost {
  private readonly logger = new Logger(JobIndexingWorker.name);

  constructor(private readonly searchIndex: SearchIndexService) {
    super();
  }

  async process(job: Job<JobIndexingJob>) {
    this.logger.log(`Search indexing worker received job: jobId=${job.id} targetJobId=${job.data.jobId}`);
    const result = await this.searchIndex.reindexJob(job.data.jobId);
    this.logger.log(`Search indexing worker completed job: jobId=${job.id} targetJobId=${job.data.jobId}`);
    return result;
  }
}
