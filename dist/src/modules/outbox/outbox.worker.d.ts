import { WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import type { JobIndexingJob, OutboxProcessingJob } from '../../queues/queue.types';
import { SearchIndexService } from '../search/search-index.service';
import { OutboxService } from './outbox.service';
export declare class OutboxWorker extends WorkerHost {
    private readonly outbox;
    private readonly logger;
    constructor(outbox: OutboxService);
    process(job: Job<OutboxProcessingJob>): Promise<{
        processed: number;
    }>;
}
export declare class JobIndexingWorker extends WorkerHost {
    private readonly searchIndex;
    private readonly logger;
    constructor(searchIndex: SearchIndexService);
    process(job: Job<JobIndexingJob>): Promise<void>;
}
