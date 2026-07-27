import type { NormalizedJobInput } from './normalization.types';
export declare class NormalizationService {
    normalize(input: NormalizedJobInput): NormalizedJobInput;
    validate(input: NormalizedJobInput): void;
}
