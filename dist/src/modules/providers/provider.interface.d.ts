import type { NormalizedJobInput } from '../normalization/normalization.types';
export type FetchJobsOptions = {
    since?: Date;
    limit?: number;
};
export type ProviderFetchResult = {
    jobs: NormalizedJobInput[];
    rawPayloadLocation?: string;
    fetchedAt: Date;
};
export interface JobProvider {
    readonly name: string;
    readonly type: string;
    fetchJobs(options: FetchJobsOptions): Promise<ProviderFetchResult>;
    fetchJob(sourceJobId: string): Promise<unknown | null>;
}
