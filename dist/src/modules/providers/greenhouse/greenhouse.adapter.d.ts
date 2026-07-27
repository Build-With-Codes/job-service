import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env';
import type { FetchJobsOptions, JobProvider, ProviderFetchResult } from '../provider.interface';
import { GreenhouseClient } from './greenhouse.client';
export declare class GreenhouseAdapter implements JobProvider {
    private readonly client;
    private readonly config;
    readonly name = "Greenhouse";
    readonly type = "greenhouse";
    constructor(client: GreenhouseClient, config: ConfigService<EnvConfig, true>);
    fetchJobs(_options: FetchJobsOptions): Promise<ProviderFetchResult>;
    fetchJob(sourceJobId: string): Promise<import("./greenhouse.types").GreenhouseJob | null>;
}
