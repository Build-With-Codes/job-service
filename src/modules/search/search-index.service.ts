import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface SearchEngine {
  search(query: unknown): Promise<unknown>;
}

@Injectable()
export class SearchIndexService {
  private readonly logger = new Logger(SearchIndexService.name);

  constructor(private readonly prisma: PrismaService) {}

  async reindexJob(jobId: string) {
    await this.prisma.db.$executeRaw`
      UPDATE "aiverse_jobs"."Job"
      SET "searchVector" =
        setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
        setweight(to_tsvector('english', coalesce("descriptionText", '')), 'B') ||
        setweight(to_tsvector('english', coalesce("employmentType", '')), 'C') ||
        setweight(to_tsvector('english', coalesce("workplaceType", '')), 'C')
      WHERE "id" = ${jobId}
    `;
    this.logger.log(`Search index refreshed for job ${jobId}`);
  }
}
