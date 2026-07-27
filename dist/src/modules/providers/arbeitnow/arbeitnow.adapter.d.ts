import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env';
import type { FetchJobsOptions, JobProvider, ProviderFetchResult } from '../provider.interface';
import { ArbeitnowClient } from './arbeitnow.client';
export declare class ArbeitnowAdapter implements JobProvider {
    private readonly client;
    private readonly config;
    readonly name = "Arbeitnow";
    readonly type = "arbeitnow";
    constructor(client: ArbeitnowClient, config: ConfigService<EnvConfig, true>);
    fetchJobs(options: FetchJobsOptions): Promise<ProviderFetchResult>;
    fetchJob(sourceJobId: string): Promise<import("./arbeitnow.types").ArbeitnowJob | null>;
}
