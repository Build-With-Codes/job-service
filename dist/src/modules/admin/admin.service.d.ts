import { PaginationDto } from '../../common/pagination/pagination.dto';
import { PrismaService } from '../../database/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    providers(input: PaginationDto): Promise<{
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
    ingestionRuns(input: PaginationDto): Promise<{
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
    ingestionErrors(input: PaginationDto): Promise<{
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
    resolveProviderType(idOrType: string, override?: string): Promise<string>;
}
