import type { NormalizedJobInput } from '../normalization/normalization.types';
export declare class FingerprintService {
    create(input: NormalizedJobInput): string;
    contentHash(input: NormalizedJobInput): string;
}
