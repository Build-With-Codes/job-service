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
        timestamp: string;
    }>;
}
