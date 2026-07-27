import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env';
import type { FetchJobsOptions, JobProvider, ProviderFetchResult } from '../provider.interface';
import { ArbeitnowClient } from './arbeitnow.client';
import { mapArbeitnowJob } from './arbeitnow.mapper';

@Injectable()
export class ArbeitnowAdapter implements JobProvider {
  readonly name = 'Arbeitnow';
  readonly type = 'arbeitnow';

  constructor(
    private readonly client: ArbeitnowClient,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async fetchJobs(options: FetchJobsOptions): Promise<ProviderFetchResult> {
    const configuredPages = this.config.get('providers', { infer: true }).arbeitnow.pages;
    const pages = Math.min(Math.max(1, options.limit ?? configuredPages), 10);
    const jobs = [];

    for (let page = 1; page <= pages; page += 1) {
      const response = await this.client.fetchJobs(page);
      jobs.push(...(response.data ?? []).map(mapArbeitnowJob));
      if (!response.links?.next) break;
    }

    return {
      jobs,
      fetchedAt: new Date(),
    };
  }

  async fetchJob(sourceJobId: string) {
    const response = await this.client.fetchJobs(1);
    return response.data?.find((job) => job.slug === sourceJobId || job.url === sourceJobId) ?? null;
  }
}
