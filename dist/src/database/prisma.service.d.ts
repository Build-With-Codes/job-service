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
    constructor(config: ConfigService<EnvConfig, true>);
    onModuleInit(): Promise<void>;
    get db(): PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/client").DefaultArgs>;
    isConnected(): boolean;
    ping(): Promise<boolean>;
    onApplicationShutdown(): Promise<void>;
}
