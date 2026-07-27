import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IngestionRunStatus, JobStatus, OutboxEventType, Prisma } from '@prisma/client';
import type { EnvConfig } from '../../config/env';
import { canonicalizeUrl } from '../../common/utils/url';
import { slugify } from '../../common/utils/slug';
import { PrismaService } from '../../database/prisma.service';
import { DeduplicationService } from '../deduplication/deduplication.service';
import { FingerprintService } from '../deduplication/fingerprint.service';
import { NormalizationService } from '../normalization/normalization.service';
import type { NormalizedJobInput } from '../normalization/normalization.types';
import { ProviderRegistry } from '../providers/provider-registry';
import { getAiJobRelevance } from './ai-job-filter';
import { IngestionRunService } from './ingestion-run.service';

type IngestionCounters = {
  jobsFetched: number;
  jobsCreated: number;
  jobsUpdated: number;
  jobsSkipped: number;
  jobsFailed: number;
};

export function buildJobSlug(input: NormalizedJobInput) {
  const base = `${slugify(input.companyName)}-${slugify(input.title)}`.replace(/^-+|-+$/g, '');
  const providerPart = slugify(input.provider);
  const sourcePart = slugify(input.sourceJobId);
  return [base || 'job', providerPart, sourcePart].filter(Boolean).join('-').slice(0, 180);
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ProviderRegistry,
    private readonly normalization: NormalizationService,
    private readonly deduplication: DeduplicationService,
    private readonly fingerprints: FingerprintService,
    private readonly runs: IngestionRunService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async syncProvider(providerType: string) {
    this.logger.log(`Provider sync starting: provider=${providerType}`);
    const adapter = this.registry.get(providerType);
    const provider = await this.prisma.db.provider.upsert({
      where: { type: adapter.type },
      update: { name: adapter.name, lastAttemptedSyncAt: new Date() },
      create: { name: adapter.name, type: adapter.type, lastAttemptedSyncAt: new Date() },
    });
    const run = await this.runs.create(provider.id);
    this.logger.log(
      `Ingestion run created: runId=${run.id} provider=${adapter.type} providerId=${provider.id}`,
    );
    const counters: IngestionCounters = {
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
      this.logger.log(
        `Fetched external jobs: provider=${adapter.type} runId=${run.id} jobsFetched=${counters.jobsFetched}`,
      );
      const seenSourceIds = new Set<string>();
      for (const [index, rawJob] of result.jobs.entries()) {
        try {
          const normalized = this.normalization.normalize(rawJob);
          seenSourceIds.add(normalized.sourceJobId);
          if (this.config.get('aiJobFilterEnabled', { infer: true })) {
            const relevance = getAiJobRelevance(normalized);
            if (!relevance.isAiRelated) {
              counters.jobsSkipped += 1;
              this.logger.log(
                `Skipped out-of-scope job: runId=${run.id} provider=${adapter.type} index=${index + 1}/${result.jobs.length} sourceJobId=${normalized.sourceJobId} score=${relevance.score} title="${normalized.title}"`,
              );
              continue;
            }
            this.logger.log(
              `Accepted future-tech job: runId=${run.id} provider=${adapter.type} sourceJobId=${normalized.sourceJobId} score=${relevance.score} title="${normalized.title}"`,
            );
          }
          const outcome = await this.persistNormalizedJob(provider.id, normalized);
          if (outcome === 'created') counters.jobsCreated += 1;
          if (outcome === 'updated') counters.jobsUpdated += 1;
          this.logger.log(
            `Persisted job: runId=${run.id} provider=${adapter.type} index=${index + 1}/${result.jobs.length} sourceJobId=${normalized.sourceJobId} outcome=${outcome} title="${normalized.title}"`,
          );
        } catch (error) {
          counters.jobsFailed += 1;
          this.logger.error(
            `Rejected/failed job during ingestion: runId=${run.id} provider=${adapter.type} sourceJobId=${rawJob.sourceJobId || 'unknown'} error=${
              error instanceof Error ? error.message : String(error)
            }`,
          );
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
      this.logger.log(
        `Marked missing provider jobs check complete: runId=${run.id} provider=${adapter.type} seenSourceIds=${seenSourceIds.size}`,
      );
      await this.prisma.db.provider.update({
        where: { id: provider.id },
        data: { lastSuccessfulSyncAt: new Date(), lastAttemptedSyncAt: new Date() },
      });
      await this.runs.complete(
        run.id,
        counters.jobsFailed > 0 ? IngestionRunStatus.PARTIAL : IngestionRunStatus.COMPLETED,
        counters,
      );
      this.logger.log(
        `Ingestion run completed: runId=${run.id} provider=${adapter.type} status=${
          counters.jobsFailed > 0 ? IngestionRunStatus.PARTIAL : IngestionRunStatus.COMPLETED
        } counters=${JSON.stringify(counters)}`,
      );
      return { provider: adapter.type, runId: run.id, ...counters };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Provider sync failed for ${providerType}: ${message}`);
      await this.runs.complete(run.id, IngestionRunStatus.FAILED, {
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

  async persistNormalizedJob(providerId: string, input: NormalizedJobInput) {
    const dedupe = await this.deduplication.check(providerId, input);
    this.logger.log(
      `Deduplication result: providerId=${providerId} sourceJobId=${input.sourceJobId} type=${dedupe.type} jobId=${dedupe.jobId ?? 'new'} confidence=${dedupe.confidence ?? 'n/a'}`,
    );
    const contentHash = this.fingerprints.contentHash(input);
    const dedupeFingerprint = this.fingerprints.create(input);
    const canonicalSourceUrl = canonicalizeUrl(input.sourceUrl);
    const now = new Date();

    return this.prisma.db.$transaction(async (tx) => {
      const company = await tx.company.upsert({
        where: { slug: slugify(input.companyName) },
        update: {
          name: input.companyName,
          normalizedName: input.companyName.toLowerCase(),
          domain: input.companyDomain,
          website: input.companyDomain ? `https://${input.companyDomain}` : undefined,
        },
        create: {
          name: input.companyName,
          normalizedName: input.companyName.toLowerCase(),
          slug: slugify(input.companyName),
          domain: input.companyDomain,
          website: input.companyDomain ? `https://${input.companyDomain}` : undefined,
        },
      });

      const existingJobId = dedupe.jobId;
      const jobSlug = buildJobSlug(input);
      const eventType = existingJobId ? OutboxEventType.JOB_UPDATED : OutboxEventType.JOB_CREATED;

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
              status: JobStatus.ACTIVE,
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
          payload: { jobId: job.id, providerId, sourceJobId: input.sourceJobId } as Prisma.InputJsonValue,
        },
      });
      this.logger.log(
        `Outbox event created in transaction: jobId=${job.id} sourceJobId=${input.sourceJobId} eventType=${eventType}`,
      );

      return existingJobId ? 'updated' : 'created';
    });
  }

  private async markMissingProviderJobs(providerId: string, seenSourceIds: Set<string>) {
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
    this.logger.log(
      `Missing-job marker touched sources: providerId=${providerId} count=${result.count}`,
    );
  }

  async expireMissingJobs() {
    this.logger.log('Job expiration scan starting.');
    const staleDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const staleJobs = await this.prisma.db.job.findMany({
      where: {
        status: JobStatus.ACTIVE,
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
          data: { status: JobStatus.EXPIRED, expiresAt: new Date() },
        }),
        this.prisma.db.outboxEvent.create({
          data: {
            eventType: OutboxEventType.JOB_EXPIRED,
            aggregateType: 'Job',
            aggregateId: job.id,
            payload: { jobId: job.id } as Prisma.InputJsonValue,
          },
        }),
      ]);
    }
    this.logger.log(`Job expiration scan complete: expired=${staleJobs.length}`);
    return { expired: staleJobs.length };
  }
}
