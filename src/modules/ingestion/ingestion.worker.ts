import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import {
  JOB_EXPIRATION_QUEUE,
  PROVIDER_SYNC_QUEUE,
} from '../../queues/queue.constants';
import type { JobExpirationJob, ProviderSyncJob } from '../../queues/queue.types';
import { IngestionService } from './ingestion.service';

@Processor(PROVIDER_SYNC_QUEUE, { concurrency: 2 })
export class ProviderSyncWorker extends WorkerHost {
  private readonly logger = new Logger(ProviderSyncWorker.name);

  constructor(private readonly ingestion: IngestionService) {
    super();
  }

  async process(job: Job<ProviderSyncJob>) {
    this.logger.log(
      `Provider sync worker received job: jobId=${job.id} provider=${job.data.providerType} requestedBy=${job.data.requestedBy}`,
    );
    try {
      const result = await this.ingestion.syncProvider(job.data.providerType);
      this.logger.log(
        `Provider sync worker completed job: jobId=${job.id} provider=${job.data.providerType} result=${JSON.stringify(result)}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Provider sync worker failed job: jobId=${job.id} provider=${job.data.providerType} error=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }
}

@Processor(JOB_EXPIRATION_QUEUE, { concurrency: 1 })
export class JobExpirationWorker extends WorkerHost {
  private readonly logger = new Logger(JobExpirationWorker.name);

  constructor(private readonly ingestion: IngestionService) {
    super();
  }

  async process(job: Job<JobExpirationJob>) {
    this.logger.log(`Job expiration worker received job: jobId=${job.id}`);
    const result = await this.ingestion.expireMissingJobs();
    this.logger.log(`Job expiration worker completed job: jobId=${job.id} result=${JSON.stringify(result)}`);
    return result;
  }
}
