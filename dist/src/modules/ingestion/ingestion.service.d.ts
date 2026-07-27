import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../config/env';
import { PrismaService } from '../../database/prisma.service';
import { DeduplicationService } from '../deduplication/deduplication.service';
import { FingerprintService } from '../deduplication/fingerprint.service';
import { NormalizationService } from '../normalization/normalization.service';
import type { NormalizedJobInput } from '../normalization/normalization.types';
import { ProviderRegistry } from '../providers/provider-registry';
import { IngestionRunService } from './ingestion-run.service';
export declare function buildJobSlug(input: NormalizedJobInput): string;
export declare class IngestionService {
    private readonly prisma;
    private readonly registry;
    private readonly normalization;
    private readonly deduplication;
    private readonly fingerprints;
    private readonly runs;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, registry: ProviderRegistry, normalization: NormalizationService, deduplication: DeduplicationService, fingerprints: FingerprintService, runs: IngestionRunService, config: ConfigService<EnvConfig, true>);
    syncProvider(providerType: string): Promise<{
        jobsFetched: number;
        jobsCreated: number;
        jobsUpdated: number;
        jobsSkipped: number;
        jobsFailed: number;
        provider: string;
        runId: string;
    }>;
    persistNormalizedJob(providerId: string, input: NormalizedJobInput): Promise<"updated" | "created">;
    private markMissingProviderJobs;
    expireMissingJobs(): Promise<{
        expired: number;
    }>;
}
