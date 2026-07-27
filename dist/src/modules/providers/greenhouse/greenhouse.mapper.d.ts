import type { NormalizedJobInput } from '../../normalization/normalization.types';
import type { GreenhouseJob } from './greenhouse.types';
export declare function mapGreenhouseJob(job: GreenhouseJob, boardToken: string, companyName?: string): NormalizedJobInput;
