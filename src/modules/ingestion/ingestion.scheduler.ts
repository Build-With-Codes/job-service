import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  JOB_EXPIRATION_QUEUE,
  OUTBOX_PROCESSING_QUEUE,
  PROVIDER_SYNC_QUEUE,
} from '../../queues/queue.constants';
import type { JobExpirationJob, OutboxProcessingJob, ProviderSyncJob } from '../../queues/queue.types';

@Injectable()
export class IngestionScheduler implements OnModuleInit {
  private readonly logger = new Logger(IngestionScheduler.name);

  constructor(
    @InjectQueue(PROVIDER_SYNC_QUEUE) private readonly providerSyncQueue: Queue<ProviderSyncJob>,
    @InjectQueue(JOB_EXPIRATION_QUEUE) private readonly expirationQueue: Queue<JobExpirationJob>,
    @InjectQueue(OUTBOX_PROCESSING_QUEUE) private readonly outboxQueue: Queue<OutboxProcessingJob>,
  ) {}

  async onModuleInit() {
    console.log('[scheduler] IngestionScheduler initialization started.');
    const providerSyncCron = process.env.PROVIDER_SYNC_CRON ?? '*/3 * * * *';
    const expirationCron = process.env.JOB_EXPIRATION_CRON ?? '0 * * * *';
    const outboxCron = process.env.OUTBOX_CRON ?? '* * * * *';
    const syncOnStartup = process.env.PROVIDER_SYNC_ON_STARTUP === 'true';
    const providers = (process.env.PROVIDER_SYNC_TYPES ?? 'greenhouse,arbeitnow')
      .split(',')
      .map((provider) => provider.trim())
      .filter(Boolean);

    for (const providerType of providers) {
      await this.withTimeout(
        `register ${providerType} provider sync repeatable job`,
        this.providerSyncQueue.add(
          `${providerType}-provider-sync`,
          { providerType, requestedBy: 'scheduler' },
          { repeat: { pattern: providerSyncCron }, jobId: `${providerType}-provider-sync` },
        ),
      );
      this.logger.log(
        `Registered repeatable provider sync: provider=${providerType} queue=${PROVIDER_SYNC_QUEUE} cron="${providerSyncCron}"`,
      );

      if (syncOnStartup) {
        await this.withTimeout(
          `register immediate ${providerType} provider sync startup job`,
          this.providerSyncQueue.add(
            `${providerType}-provider-sync-now`,
            { providerType, requestedBy: 'scheduler' },
            { jobId: `${providerType}-provider-sync-now-${Date.now()}`, attempts: 1 },
          ),
        );
        this.logger.log(
          `Queued immediate provider sync startup job: provider=${providerType} queue=${PROVIDER_SYNC_QUEUE}`,
        );
      } else {
        this.logger.log(
          `Skipped immediate provider sync startup job: provider=${providerType}; enable PROVIDER_SYNC_ON_STARTUP=true to run it.`,
        );
      }
    }

    await this.withTimeout(
      'register job expiration repeatable job',
      this.expirationQueue.add(
        'job-expiration',
        { requestedBy: 'scheduler' },
        { repeat: { pattern: expirationCron }, jobId: 'job-expiration' },
      ),
    );
    this.logger.log(
      `Registered repeatable job expiration: queue=${JOB_EXPIRATION_QUEUE} cron="${expirationCron}"`,
    );

    await this.withTimeout(
      'register outbox repeatable job',
      this.outboxQueue.add(
        'outbox-processing',
        { requestedBy: 'scheduler' },
        { repeat: { pattern: outboxCron }, jobId: 'outbox-processing' },
      ),
    );
    this.logger.log(
      `Registered repeatable outbox processing: queue=${OUTBOX_PROCESSING_QUEUE} cron="${outboxCron}"`,
    );
    console.log('[scheduler] IngestionScheduler initialization completed.');
  }

  private async withTimeout<T>(label: string, promise: Promise<T>) {
    console.log(`[scheduler] Starting queue operation: ${label}`);
    let timeout: NodeJS.Timeout | undefined;
    try {
      const result = await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error(`Timed out after 10s: ${label}`)),
            10_000,
          );
        }),
      ]);
      console.log(`[scheduler] Completed queue operation: ${label}`);
      return result;
    } catch (error) {
      console.error(
        `[scheduler] Failed queue operation: ${label}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
