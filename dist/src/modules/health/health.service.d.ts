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
        prisma: {
            configured: boolean;
            connected: boolean;
            lastError: string | null;
            runtimeConnection: {
                type: string;
                env: string;
                host: string | null;
                poolMax: number;
            };
            migrationConnection: {
                type: string;
                env: string | null;
                configured: boolean;
            };
        };
        timestamp: string;
    }>;
}
