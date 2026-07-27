import { PrismaService } from '../../database/prisma.service';
export interface SearchEngine {
    search(query: unknown): Promise<unknown>;
}
export declare class SearchIndexService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    reindexJob(jobId: string): Promise<void>;
}
