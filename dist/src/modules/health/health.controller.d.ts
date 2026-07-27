import { HealthService } from './health.service';
export declare class HealthController {
    private readonly health;
    constructor(health: HealthService);
    healthCheck(): {
        ok: boolean;
        service: string;
        timestamp: string;
    };
    readyCheck(): Promise<{
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
