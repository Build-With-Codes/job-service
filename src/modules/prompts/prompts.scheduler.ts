import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PromptsService } from './prompts.service';

@Injectable()
export class PromptsScheduler implements OnModuleInit {
  private readonly logger = new Logger(PromptsScheduler.name);
  private running = false;

  constructor(private readonly prompts: PromptsService) {}

  async onModuleInit() {
    const intervalMs = this.resolveIntervalMs();
    const enabled = process.env.PROMPT_SYNC_ENABLED !== 'false';
    const syncOnStartup = process.env.PROMPT_SYNC_ON_STARTUP === 'true';

    if (!enabled) {
      this.logger.warn('Prompt sync scheduler disabled by PROMPT_SYNC_ENABLED=false.');
      return;
    }

    this.logger.log(`Prompt sync scheduler enabled: every ${intervalMs}ms.`);
    if (syncOnStartup) {
      await this.syncOnce('startup');
    } else {
      this.logger.log('Prompt startup sync skipped; enable PROMPT_SYNC_ON_STARTUP=true to run it during boot.');
    }

    setInterval(() => {
      void this.syncOnce('interval');
    }, intervalMs).unref();
  }

  private resolveIntervalMs() {
    const fallback = 300_000;
    const minimum = 60_000;
    const raw = process.env.PROMPT_SYNC_INTERVAL_MS;
    const parsed = raw ? Number(raw) : fallback;

    if (!Number.isFinite(parsed)) {
      this.logger.warn(
        `Invalid PROMPT_SYNC_INTERVAL_MS="${raw}". Expected milliseconds, for example 300000 for 5 minutes. Falling back to ${fallback}ms.`,
      );
      return fallback;
    }

    if (parsed < minimum) {
      this.logger.warn(
        `PROMPT_SYNC_INTERVAL_MS=${parsed} is too low for production. Using minimum ${minimum}ms.`,
      );
      return minimum;
    }

    return parsed;
  }

  private async syncOnce(reason: string) {
    if (this.running) {
      this.logger.warn(`Prompt sync skipped (${reason}): previous sync is still running.`);
      return;
    }

    this.running = true;
    try {
      const result = await this.prompts.syncFromConfiguredSources();
      this.logger.log(
        `Prompt sync finished (${reason}): sources=${result.sources} found=${result.promptsFound} saved=${result.promptsSaved}`,
      );
    } catch (error) {
      this.logger.error(
        `Prompt sync failed (${reason}): ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.running = false;
    }
  }
}
