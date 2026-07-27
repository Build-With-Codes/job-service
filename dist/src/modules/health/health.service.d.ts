import { PrismaService } from '../../database/prisma.service';
export declare class HealthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    health(): {
        ok: boolean;
        service: string;
        timestamp: string;
    };
    ready(): Promise<{
        ok: boolean;
        database: boolean;
        timestamp: string;
    }>;
}
