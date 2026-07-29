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
    const schedulerEnabled = process.env.BULL_SCHEDULER_ENABLED !== 'false';
    const providerSyncEnabled = process.env.PROVIDER_SYNC_SCHEDULER_ENABLED !== 'false';
    const expirationEnabled = process.env.JOB_EXPIRATION_SCHEDULER_ENABLED !== 'false';
    const outboxEnabled = process.env.OUTBOX_SCHEDULER_ENABLED !== 'false';
    const providerSyncCron = process.env.PROVIDER_SYNC_CRON ?? '*/15 * * * *';
    const expirationCron = process.env.JOB_EXPIRATION_CRON ?? '0 * * * *';
    const outboxCron = process.env.OUTBOX_CRON ?? '*/5 * * * *';
    const syncOnStartup = process.env.PROVIDER_SYNC_ON_STARTUP === 'true';
    const providers = (process.env.PROVIDER_SYNC_TYPES ?? 'greenhouse,arbeitnow')
      .split(',')
      .map((provider) => provider.trim())
      .filter(Boolean);

    if (!schedulerEnabled) {
      this.logger.warn('BullMQ scheduler disabled by BULL_SCHEDULER_ENABLED=false.');
      return;
    }

    if (providerSyncEnabled) {
      for (const providerType of providers) {
        const registered = await this.withTimeout(
          `register ${providerType} provider sync repeatable job`,
          this.providerSyncQueue.add(
            `${providerType}-provider-sync`,
            { providerType, requestedBy: 'scheduler' },
            { repeat: { pattern: providerSyncCron }, jobId: `${providerType}-provider-sync` },
          ),
        );

        if (!registered) return;

        this.logger.log(
          `Registered repeatable provider sync: provider=${providerType} queue=${PROVIDER_SYNC_QUEUE} cron="${providerSyncCron}"`,
        );

        if (syncOnStartup) {
          const startupQueued = await this.withTimeout(
            `register immediate ${providerType} provider sync startup job`,
            this.providerSyncQueue.add(
              `${providerType}-provider-sync-now`,
              { providerType, requestedBy: 'scheduler' },
              { jobId: `${providerType}-provider-sync-now-${Date.now()}`, attempts: 1 },
            ),
          );

          if (!startupQueued) return;

          this.logger.log(
            `Queued immediate provider sync startup job: provider=${providerType} queue=${PROVIDER_SYNC_QUEUE}`,
          );
        } else {
          this.logger.log(
            `Skipped immediate provider sync startup job: provider=${providerType}; enable PROVIDER_SYNC_ON_STARTUP=true to run it.`,
          );
        }
      }
    } else {
      this.logger.warn('Provider sync repeatable jobs disabled by PROVIDER_SYNC_SCHEDULER_ENABLED=false.');
    }

    if (expirationEnabled) {
      const expirationRegistered = await this.withTimeout(
        'register job expiration repeatable job',
        this.expirationQueue.add(
          'job-expiration',
          { requestedBy: 'scheduler' },
          { repeat: { pattern: expirationCron }, jobId: 'job-expiration' },
        ),
      );

      if (!expirationRegistered) return;

      this.logger.log(
        `Registered repeatable job expiration: queue=${JOB_EXPIRATION_QUEUE} cron="${expirationCron}"`,
      );
    } else {
      this.logger.warn('Job expiration repeatable job disabled by JOB_EXPIRATION_SCHEDULER_ENABLED=false.');
    }

    if (outboxEnabled) {
      const outboxRegistered = await this.withTimeout(
        'register outbox repeatable job',
        this.outboxQueue.add(
          'outbox-processing',
          { requestedBy: 'scheduler' },
          { repeat: { pattern: outboxCron }, jobId: 'outbox-processing' },
        ),
      );

      if (!outboxRegistered) return;

      this.logger.log(
        `Registered repeatable outbox processing: queue=${OUTBOX_PROCESSING_QUEUE} cron="${outboxCron}"`,
      );
    } else {
      this.logger.warn('Outbox repeatable job disabled by OUTBOX_SCHEDULER_ENABLED=false.');
    }
    console.log('[scheduler] IngestionScheduler initialization completed.');
  }

  private async withTimeout<T>(label: string, promise: Promise<T>) {
    console.log(`[scheduler] Starting queue operation: ${label}`);
    let timeout: NodeJS.Timeout | undefined;
    const timeoutMs = this.resolveQueueOperationTimeoutMs();
    try {
      const result = await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error(`Timed out after ${Math.round(timeoutMs / 1000)}s: ${label}`)),
            timeoutMs,
          );
        }),
      ]);
      console.log(`[scheduler] Completed queue operation: ${label}`);
      return result;
    } catch (error) {
      if (this.isQueueOperationTimeoutError(error)) {
        this.logger.error(
          `Timed out during "${label}". Scheduler will stay up without registering more BullMQ repeatable jobs. Check Redis connectivity/quota, or set BULL_SCHEDULER_ENABLED=false to skip BullMQ scheduler startup.`,
        );
        return undefined;
      }

      if (this.isRedisRequestLimitError(error)) {
        this.logger.error(
          `Redis request quota exhausted during "${label}". Scheduler will stay up without registering more BullMQ repeatable jobs. Disable scheduler/worker services until the quota resets, or upgrade Redis.`,
        );
        return undefined;
      }

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

  private isRedisRequestLimitError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('ERR max requests limit exceeded');
  }

  private isQueueOperationTimeoutError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return message.startsWith('Timed out after ');
  }

  private resolveQueueOperationTimeoutMs() {
    const fallback = 30_000;
    const raw = process.env.QUEUE_OPERATION_TIMEOUT_MS;
    if (!raw) return fallback;

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 1_000) {
      this.logger.warn(
        `Invalid QUEUE_OPERATION_TIMEOUT_MS="${raw}". Using ${fallback}ms.`,
      );
      return fallback;
    }

    return parsed;
  }
}
