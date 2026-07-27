import { WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import type { JobExpirationJob, ProviderSyncJob } from '../../queues/queue.types';
import { IngestionService } from './ingestion.service';
export declare class ProviderSyncWorker extends WorkerHost {
    private readonly ingestion;
    private readonly logger;
    constructor(ingestion: IngestionService);
    process(job: Job<ProviderSyncJob>): Promise<{
        jobsFetched: number;
        jobsCreated: number;
        jobsUpdated: number;
        jobsSkipped: number;
        jobsFailed: number;
        provider: string;
        runId: string;
    }>;
}
export declare class JobExpirationWorker extends WorkerHost {
    private readonly ingestion;
    private readonly logger;
    constructor(ingestion: IngestionService);
    process(job: Job<JobExpirationJob>): Promise<{
        expired: number;
    }>;
}
