import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PromptsService } from './prompts.service';

@Injectable()
export class PromptsScheduler implements OnModuleInit {
  private readonly logger = new Logger(PromptsScheduler.name);
  private running = false;

  constructor(private readonly prompts: PromptsService) {}

  async onModuleInit() {
    const intervalMs = Number(process.env.PROMPT_SYNC_INTERVAL_MS ?? 120_000);
    const enabled = process.env.PROMPT_SYNC_ENABLED !== 'false';

    if (!enabled) {
      this.logger.warn('Prompt sync scheduler disabled by PROMPT_SYNC_ENABLED=false.');
      return;
    }

    this.logger.log(`Prompt sync scheduler enabled: every ${intervalMs}ms.`);
    await this.syncOnce('startup');

    setInterval(() => {
      void this.syncOnce('interval');
    }, intervalMs).unref();
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
