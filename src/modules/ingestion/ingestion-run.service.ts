import { Injectable } from '@nestjs/common';
import { IngestionRunStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class IngestionRunService {
  constructor(private readonly prisma: PrismaService) {}

  create(providerId: string) {
    return this.prisma.db.ingestionRun.create({
      data: { providerId, status: IngestionRunStatus.RUNNING },
    });
  }

  recordError(input: {
    ingestionRunId: string;
    provider: string;
    sourceJobId?: string;
    errorType: string;
    errorMessage: string;
    payloadLocation?: string;
  }) {
    return this.prisma.db.ingestionError.create({
      data: input,
    });
  }

  complete(
    id: string,
    status: IngestionRunStatus,
    counters: {
      jobsFetched?: number;
      jobsCreated?: number;
      jobsUpdated?: number;
      jobsSkipped?: number;
      jobsExpired?: number;
      jobsFailed?: number;
      errorMessage?: string;
    },
  ) {
    return this.prisma.db.ingestionRun.update({
      where: { id },
      data: {
        status,
        completedAt: new Date(),
        jobsFetched: counters.jobsFetched ?? 0,
        jobsCreated: counters.jobsCreated ?? 0,
        jobsUpdated: counters.jobsUpdated ?? 0,
        jobsSkipped: counters.jobsSkipped ?? 0,
        jobsExpired: counters.jobsExpired ?? 0,
        jobsFailed: counters.jobsFailed ?? 0,
        errorMessage: counters.errorMessage,
      },
    });
  }
}
