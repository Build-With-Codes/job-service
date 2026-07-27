import type { Queue } from 'bullmq';
import type { JobIndexingJob } from '../../queues/queue.types';
import { PrismaService } from '../../database/prisma.service';
export declare class OutboxService {
    private readonly prisma;
    private readonly indexingQueue;
    private readonly logger;
    constructor(prisma: PrismaService, indexingQueue: Queue<JobIndexingJob>);
    processPending(limit?: number): Promise<{
        processed: number;
    }>;
}
