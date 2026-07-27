import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env';
import type { FetchJobsOptions, JobProvider, ProviderFetchResult } from '../provider.interface';
import { GreenhouseClient } from './greenhouse.client';
import { mapGreenhouseJob } from './greenhouse.mapper';

@Injectable()
export class GreenhouseAdapter implements JobProvider {
  readonly name = 'Greenhouse';
  readonly type = 'greenhouse';

  constructor(
    private readonly client: GreenhouseClient,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async fetchJobs(_options: FetchJobsOptions): Promise<ProviderFetchResult> {
    const boardToken = this.config.get('providers', { infer: true }).greenhouse.boardToken;
    if (!boardToken) {
      throw new Error('GREENHOUSE_BOARD_TOKEN is required to run the Greenhouse provider.');
    }
    const companyName =
      this.config.get('providers', { infer: true }).greenhouse.companyName ?? boardToken;
    const payload = await this.client.fetchJobs(boardToken);
    return {
      jobs: payload.jobs.map((job) => mapGreenhouseJob(job, boardToken, companyName)),
      fetchedAt: new Date(),
    };
  }

  async fetchJob(sourceJobId: string) {
    const boardToken = this.config.get('providers', { infer: true }).greenhouse.boardToken;
    if (!boardToken) {
      throw new Error('GREENHOUSE_BOARD_TOKEN is required to run the Greenhouse provider.');
    }
    return this.client.fetchJob(boardToken, sourceJobId);
  }
}
