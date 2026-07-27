import { OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bullmq';
import type { JobExpirationJob, OutboxProcessingJob, ProviderSyncJob } from '../../queues/queue.types';
export declare class IngestionScheduler implements OnModuleInit {
    private readonly providerSyncQueue;
    private readonly expirationQueue;
    private readonly outboxQueue;
    private readonly logger;
    constructor(providerSyncQueue: Queue<ProviderSyncJob>, expirationQueue: Queue<JobExpirationJob>, outboxQueue: Queue<OutboxProcessingJob>);
    onModuleInit(): Promise<void>;
    private withTimeout;
}
