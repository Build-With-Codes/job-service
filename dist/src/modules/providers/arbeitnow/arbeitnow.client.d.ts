import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env';
import type { ArbeitnowJobsResponse } from './arbeitnow.types';
export declare class ArbeitnowClient {
    private readonly config;
    constructor(config: ConfigService<EnvConfig, true>);
    fetchJobs(page: number): Promise<ArbeitnowJobsResponse>;
}
