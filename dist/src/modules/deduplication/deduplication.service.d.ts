import { PrismaService } from '../../database/prisma.service';
import type { NormalizedJobInput } from '../normalization/normalization.types';
import { FingerprintService } from './fingerprint.service';
export type DeduplicationResult = {
    type: 'NEW' | 'UPDATE' | 'DUPLICATE' | 'POSSIBLE_DUPLICATE';
    jobId?: string;
    confidence?: number;
};
export declare class DeduplicationService {
    private readonly prisma;
    private readonly fingerprints;
    constructor(prisma: PrismaService, fingerprints: FingerprintService);
    check(providerId: string, input: NormalizedJobInput): Promise<DeduplicationResult>;
}
