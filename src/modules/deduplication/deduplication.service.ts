import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { canonicalizeUrl } from '../../common/utils/url';
import type { NormalizedJobInput } from '../normalization/normalization.types';
import { FingerprintService } from './fingerprint.service';

export type DeduplicationResult = {
  type: 'NEW' | 'UPDATE' | 'DUPLICATE' | 'POSSIBLE_DUPLICATE';
  jobId?: string;
  confidence?: number;
};

@Injectable()
export class DeduplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fingerprints: FingerprintService,
  ) {}

  async check(providerId: string, input: NormalizedJobInput): Promise<DeduplicationResult> {
    const providerSource = await this.prisma.db.jobSource.findUnique({
      where: {
        providerId_sourceJobId: {
          providerId,
          sourceJobId: input.sourceJobId,
        },
      },
    });
    if (providerSource) return { type: 'UPDATE', jobId: providerSource.jobId, confidence: 1 };

    const canonicalSourceUrl = canonicalizeUrl(input.sourceUrl);
    const urlSource = await this.prisma.db.jobSource.findFirst({
      where: { canonicalSourceUrl },
    });
    if (urlSource) return { type: 'DUPLICATE', jobId: urlSource.jobId, confidence: 0.98 };

    const fingerprint = this.fingerprints.create(input);
    const fingerprintMatch = await this.prisma.db.job.findFirst({
      where: { dedupeFingerprint: fingerprint },
      select: { id: true },
    });
    if (fingerprintMatch) {
      return { type: 'DUPLICATE', jobId: fingerprintMatch.id, confidence: 0.95 };
    }

    return { type: 'NEW' };
  }
}
