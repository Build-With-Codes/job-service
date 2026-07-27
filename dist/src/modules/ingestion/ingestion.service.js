"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IngestionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionService = void 0;
exports.buildJobSlug = buildJobSlug;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const url_1 = require("../../common/utils/url");
const slug_1 = require("../../common/utils/slug");
const prisma_service_1 = require("../../database/prisma.service");
const deduplication_service_1 = require("../deduplication/deduplication.service");
const fingerprint_service_1 = require("../deduplication/fingerprint.service");
const normalization_service_1 = require("../normalization/normalization.service");
const provider_registry_1 = require("../providers/provider-registry");
const ai_job_filter_1 = require("./ai-job-filter");
const ingestion_run_service_1 = require("./ingestion-run.service");
function buildJobSlug(input) {
    const base = `${(0, slug_1.slugify)(input.companyName)}-${(0, slug_1.slugify)(input.title)}`.replace(/^-+|-+$/g, '');
    const providerPart = (0, slug_1.slugify)(input.provider);
    const sourcePart = (0, slug_1.slugify)(input.sourceJobId);
    return [base || 'job', providerPart, sourcePart].filter(Boolean).join('-').slice(0, 180);
}
let IngestionService = IngestionService_1 = class IngestionService {
    prisma;
    registry;
    normalization;
    deduplication;
    fingerprints;
    runs;
    config;
    logger = new common_1.Logger(IngestionService_1.name);
    constructor(prisma, registry, normalization, deduplication, fingerprints, runs, config) {
        this.prisma = prisma;
        this.registry = registry;
        this.normalization = normalization;
        this.deduplication = deduplication;
        this.fingerprints = fingerprints;
        this.runs = runs;
        this.config = config;
    }
    async syncProvider(providerType) {
        this.logger.log(`Provider sync starting: provider=${providerType}`);
        const adapter = this.registry.get(providerType);
        const provider = await this.prisma.db.provider.upsert({
            where: { type: adapter.type },
            update: { name: adapter.name, lastAttemptedSyncAt: new Date() },
            create: { name: adapter.name, type: adapter.type, lastAttemptedSyncAt: new Date() },
        });
        const run = await this.runs.create(provider.id);
        this.logger.log(`Ingestion run created: runId=${run.id} provider=${adapter.type} providerId=${provider.id}`);
        const counters = {
            jobsFetched: 0,
            jobsCreated: 0,
            jobsUpdated: 0,
            jobsSkipped: 0,
            jobsFailed: 0,
        };
        try {
            this.logger.log(`Fetching external jobs: provider=${adapter.type} runId=${run.id}`);
            const result = await adapter.fetchJobs({});
            counters.jobsFetched = result.jobs.length;
            this.logger.log(`Fetched external jobs: provider=${adapter.type} runId=${run.id} jobsFetched=${counters.jobsFetched}`);
            const seenSourceIds = new Set();
            for (const [index, rawJob] of result.jobs.entries()) {
                try {
                    const normalized = this.normalization.normalize(rawJob);
                    seenSourceIds.add(normalized.sourceJobId);
                    if (this.config.get('aiJobFilterEnabled', { infer: true })) {
                        const relevance = (0, ai_job_filter_1.getAiJobRelevance)(normalized);
                        if (!relevance.isAiRelated) {
                            counters.jobsSkipped += 1;
                            this.logger.log(`Skipped out-of-scope job: runId=${run.id} provider=${adapter.type} index=${index + 1}/${result.jobs.length} sourceJobId=${normalized.sourceJobId} score=${relevance.score} title="${normalized.title}"`);
                            continue;
                        }
                        this.logger.log(`Accepted future-tech job: runId=${run.id} provider=${adapter.type} sourceJobId=${normalized.sourceJobId} score=${relevance.score} title="${normalized.title}"`);
                    }
                    const outcome = await this.persistNormalizedJob(provider.id, normalized);
                    if (outcome === 'created')
                        counters.jobsCreated += 1;
                    if (outcome === 'updated')
                        counters.jobsUpdated += 1;
                    this.logger.log(`Persisted job: runId=${run.id} provider=${adapter.type} index=${index + 1}/${result.jobs.length} sourceJobId=${normalized.sourceJobId} outcome=${outcome} title="${normalized.title}"`);
                }
                catch (error) {
                    counters.jobsFailed += 1;
                    this.logger.error(`Rejected/failed job during ingestion: runId=${run.id} provider=${adapter.type} sourceJobId=${rawJob.sourceJobId || 'unknown'} error=${error instanceof Error ? error.message : String(error)}`);
                    await this.runs.recordError({
                        ingestionRunId: run.id,
                        provider: adapter.type,
                        sourceJobId: rawJob.sourceJobId,
                        errorType: error instanceof Error ? error.name : 'UnknownError',
                        errorMessage: error instanceof Error ? error.message : String(error),
                    });
                }
            }
            await this.markMissingProviderJobs(provider.id, seenSourceIds);
            this.logger.log(`Marked missing provider jobs check complete: runId=${run.id} provider=${adapter.type} seenSourceIds=${seenSourceIds.size}`);
            await this.prisma.db.provider.update({
                where: { id: provider.id },
                data: { lastSuccessfulSyncAt: new Date(), lastAttemptedSyncAt: new Date() },
            });
            await this.runs.complete(run.id, counters.jobsFailed > 0 ? client_1.IngestionRunStatus.PARTIAL : client_1.IngestionRunStatus.COMPLETED, counters);
            this.logger.log(`Ingestion run completed: runId=${run.id} provider=${adapter.type} status=${counters.jobsFailed > 0 ? client_1.IngestionRunStatus.PARTIAL : client_1.IngestionRunStatus.COMPLETED} counters=${JSON.stringify(counters)}`);
            return { provider: adapter.type, runId: run.id, ...counters };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Provider sync failed for ${providerType}: ${message}`);
            await this.runs.complete(run.id, client_1.IngestionRunStatus.FAILED, {
                ...counters,
                errorMessage: message,
            });
            await this.prisma.db.provider.update({
                where: { id: provider.id },
                data: { lastAttemptedSyncAt: new Date() },
            });
            throw error;
        }
    }
    async persistNormalizedJob(providerId, input) {
        const dedupe = await this.deduplication.check(providerId, input);
        this.logger.log(`Deduplication result: providerId=${providerId} sourceJobId=${input.sourceJobId} type=${dedupe.type} jobId=${dedupe.jobId ?? 'new'} confidence=${dedupe.confidence ?? 'n/a'}`);
        const contentHash = this.fingerprints.contentHash(input);
        const dedupeFingerprint = this.fingerprints.create(input);
        const canonicalSourceUrl = (0, url_1.canonicalizeUrl)(input.sourceUrl);
        const now = new Date();
        return this.prisma.db.$transaction(async (tx) => {
            const company = await tx.company.upsert({
                where: { slug: (0, slug_1.slugify)(input.companyName) },
                update: {
                    name: input.companyName,
                    normalizedName: input.companyName.toLowerCase(),
                    domain: input.companyDomain,
                    website: input.companyDomain ? `https://${input.companyDomain}` : undefined,
                },
                create: {
                    name: input.companyName,
                    normalizedName: input.companyName.toLowerCase(),
                    slug: (0, slug_1.slugify)(input.companyName),
                    domain: input.companyDomain,
                    website: input.companyDomain ? `https://${input.companyDomain}` : undefined,
                },
            });
            const existingJobId = dedupe.jobId;
            const jobSlug = buildJobSlug(input);
            const eventType = existingJobId ? client_1.OutboxEventType.JOB_UPDATED : client_1.OutboxEventType.JOB_CREATED;
            const job = existingJobId
                ? await tx.job.update({
                    where: { id: existingJobId },
                    data: {
                        companyId: company.id,
                        title: input.title,
                        description: input.description,
                        descriptionText: input.descriptionText,
                        employmentType: input.employmentType,
                        workplaceType: input.workplaceType,
                        salaryMin: input.salaryMin,
                        salaryMax: input.salaryMax,
                        salaryCurrency: input.salaryCurrency,
                        salaryPeriod: input.salaryPeriod,
                        postedAt: input.postedAt,
                        lastSeenAt: now,
                        status: client_1.JobStatus.ACTIVE,
                        contentHash,
                        dedupeFingerprint,
                        missingSyncCount: 0,
                    },
                })
                : await tx.job.create({
                    data: {
                        companyId: company.id,
                        title: input.title,
                        slug: jobSlug,
                        description: input.description,
                        descriptionText: input.descriptionText,
                        employmentType: input.employmentType,
                        workplaceType: input.workplaceType,
                        salaryMin: input.salaryMin,
                        salaryMax: input.salaryMax,
                        salaryCurrency: input.salaryCurrency,
                        salaryPeriod: input.salaryPeriod,
                        postedAt: input.postedAt,
                        firstSeenAt: now,
                        lastSeenAt: now,
                        contentHash,
                        dedupeFingerprint,
                    },
                });
            await tx.jobSource.upsert({
                where: { providerId_sourceJobId: { providerId, sourceJobId: input.sourceJobId } },
                update: {
                    jobId: job.id,
                    sourceUrl: input.sourceUrl,
                    canonicalSourceUrl,
                    applyUrl: input.applyUrl,
                    lastSeenAt: now,
                },
                create: {
                    jobId: job.id,
                    providerId,
                    sourceJobId: input.sourceJobId,
                    sourceUrl: input.sourceUrl,
                    canonicalSourceUrl,
                    applyUrl: input.applyUrl,
                    firstSeenAt: now,
                    lastSeenAt: now,
                },
            });
            await tx.jobLocation.deleteMany({ where: { jobId: job.id } });
            await tx.jobLocation.createMany({
                data: input.locations.map((location) => ({
                    jobId: job.id,
                    city: location.city,
                    state: location.state,
                    country: location.country,
                    countryCode: location.countryCode,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    isRemote: location.isRemote,
                })),
            });
            if (input.skills?.length) {
                await tx.jobSkill.deleteMany({ where: { jobId: job.id } });
                for (const skillName of input.skills) {
                    const skill = await tx.skill.upsert({
                        where: { normalizedName: skillName.toLowerCase() },
                        update: { name: skillName },
                        create: { name: skillName, normalizedName: skillName.toLowerCase() },
                    });
                    await tx.jobSkill.create({
                        data: { jobId: job.id, skillId: skill.id },
                    });
                }
            }
            await tx.outboxEvent.create({
                data: {
                    eventType,
                    aggregateType: 'Job',
                    aggregateId: job.id,
                    payload: { jobId: job.id, providerId, sourceJobId: input.sourceJobId },
                },
            });
            this.logger.log(`Outbox event created in transaction: jobId=${job.id} sourceJobId=${input.sourceJobId} eventType=${eventType}`);
            return existingJobId ? 'updated' : 'created';
        });
    }
    async markMissingProviderJobs(providerId, seenSourceIds) {
        if (seenSourceIds.size === 0) {
            this.logger.warn(`Skipping missing-job marking because provider returned zero source ids: providerId=${providerId}`);
            return;
        }
        const result = await this.prisma.db.jobSource.updateMany({
            where: {
                providerId,
                sourceJobId: { notIn: [...seenSourceIds] },
            },
            data: { updatedAt: new Date() },
        });
        this.logger.log(`Missing-job marker touched sources: providerId=${providerId} count=${result.count}`);
    }
    async expireMissingJobs() {
        this.logger.log('Job expiration scan starting.');
        const staleDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const staleJobs = await this.prisma.db.job.findMany({
            where: {
                status: client_1.JobStatus.ACTIVE,
                lastSeenAt: { lt: staleDate },
                missingSyncCount: { gte: 2 },
            },
            select: { id: true },
            take: 500,
        });
        for (const job of staleJobs) {
            this.logger.log(`Expiring stale job: jobId=${job.id}`);
            await this.prisma.db.$transaction([
                this.prisma.db.job.update({
                    where: { id: job.id },
                    data: { status: client_1.JobStatus.EXPIRED, expiresAt: new Date() },
                }),
                this.prisma.db.outboxEvent.create({
                    data: {
                        eventType: client_1.OutboxEventType.JOB_EXPIRED,
                        aggregateType: 'Job',
                        aggregateId: job.id,
                        payload: { jobId: job.id },
                    },
                }),
            ]);
        }
        this.logger.log(`Job expiration scan complete: expired=${staleJobs.length}`);
        return { expired: staleJobs.length };
    }
};
exports.IngestionService = IngestionService;
exports.IngestionService = IngestionService = IngestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        provider_registry_1.ProviderRegistry,
        normalization_service_1.NormalizationService,
        deduplication_service_1.DeduplicationService,
        fingerprint_service_1.FingerprintService,
        ingestion_run_service_1.IngestionRunService,
        config_1.ConfigService])
], IngestionService);
//# sourceMappingURL=ingestion.service.js.map