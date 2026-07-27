import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env';
import type { GreenhouseJob, GreenhouseJobsResponse } from './greenhouse.types';
export declare class GreenhouseClient {
    private readonly config;
    constructor(config: ConfigService<EnvConfig, true>);
    fetchJobs(boardToken: string): Promise<GreenhouseJobsResponse>;
    fetchJob(boardToken: string, sourceJobId: string): Promise<GreenhouseJob | null>;
}
