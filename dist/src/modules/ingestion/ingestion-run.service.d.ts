import { IngestionRunStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class IngestionRunService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(providerId: string): import(".prisma/client").Prisma.Prisma__IngestionRunClient<{
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
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    recordError(input: {
        ingestionRunId: string;
        provider: string;
        sourceJobId?: string;
        errorType: string;
        errorMessage: string;
        payloadLocation?: string;
    }): import(".prisma/client").Prisma.Prisma__IngestionErrorClient<{
        provider: string;
        id: string;
        createdAt: Date;
        sourceJobId: string | null;
        errorMessage: string;
        ingestionRunId: string;
        errorType: string;
        payloadLocation: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    complete(id: string, status: IngestionRunStatus, counters: {
        jobsFetched?: number;
        jobsCreated?: number;
        jobsUpdated?: number;
        jobsSkipped?: number;
        jobsExpired?: number;
        jobsFailed?: number;
        errorMessage?: string;
    }): import(".prisma/client").Prisma.Prisma__IngestionRunClient<{
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
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
