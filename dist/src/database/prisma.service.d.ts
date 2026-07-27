import { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import type { EnvConfig } from '../config/env';
export declare class PrismaService implements OnModuleInit, OnApplicationShutdown {
    private readonly config;
    private readonly logger;
    private readonly schemaName;
    private readonly pool;
    private readonly client;
    private connected;
    private lastError;
    private readonly runtimeConnectionHost;
    constructor(config: ConfigService<EnvConfig, true>);
    onModuleInit(): Promise<void>;
    get db(): PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/client").DefaultArgs>;
    isConnected(): boolean;
    getStatus(): {
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
    ping(): Promise<boolean>;
    onApplicationShutdown(): Promise<void>;
    private resolveDatabaseUrl;
    private extractConnectionHost;
}
