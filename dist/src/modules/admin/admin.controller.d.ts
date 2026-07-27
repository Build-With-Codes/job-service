import type { Queue } from 'bullmq';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import type { JobIndexingJob, ProviderSyncJob } from '../../queues/queue.types';
import { SyncProviderDto } from '../ingestion/ingestion.dto';
import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly admin;
    private readonly providerSyncQueue;
    private readonly indexingQueue;
    constructor(admin: AdminService, providerSyncQueue: Queue<ProviderSyncJob>, indexingQueue: Queue<JobIndexingJob>);
    providers(query: PaginationDto): Promise<{
        data: {
            name: string;
            id: string;
            type: string;
            status: import(".prisma/client").$Enums.ProviderStatus;
            configuration: import("@prisma/client/runtime/client").JsonValue | null;
            lastSuccessfulSyncAt: Date | null;
            lastAttemptedSyncAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    ingestionRuns(query: PaginationDto): Promise<{
        data: ({
            provider: {
                name: string;
                id: string;
                type: string;
                status: import(".prisma/client").$Enums.ProviderStatus;
                configuration: import("@prisma/client/runtime/client").JsonValue | null;
                lastSuccessfulSyncAt: Date | null;
                lastAttemptedSyncAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.IngestionRunStatus;
            providerId: string;
            startedAt: Date;
            completedAt: Date | null;
            jobsFetched: number;
            jobsCreated: number;
            jobsUpdated: number;
            jobsSkipped: number;
            jobsExpired: number;
            jobsFailed: number;
            errorMessage: string | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    ingestionErrors(query: PaginationDto): Promise<{
        data: ({
            ingestionRun: {
                id: string;
                status: import(".prisma/client").$Enums.IngestionRunStatus;
                providerId: string;
                startedAt: Date;
                completedAt: Date | null;
                jobsFetched: number;
                jobsCreated: number;
                jobsUpdated: number;
                jobsSkipped: number;
                jobsExpired: number;
                jobsFailed: number;
                errorMessage: string | null;
            };
        } & {
            provider: string;
            id: string;
            createdAt: Date;
            sourceJobId: string | null;
            errorMessage: string;
            ingestionRunId: string;
            errorType: string;
            payloadLocation: string | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    sync(id: string, body: Partial<SyncProviderDto>): Promise<{
        ok: boolean;
        queued: boolean;
        queue: string;
        jobId: string | undefined;
        providerType: string;
    }>;
    reindex(id: string): Promise<{
        ok: boolean;
        queued: boolean;
        queue: string;
        jobId: string | undefined;
        job: string;
    }>;
}
