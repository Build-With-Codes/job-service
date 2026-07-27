import type { NormalizedJobInput } from '../normalization/normalization.types';
export declare function getAiJobRelevance(job: NormalizedJobInput): {
    isAiRelated: boolean;
    score: number;
    strongTitleMatches: number;
    strongMatches: number;
    supportingMatches: number;
};
