import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import type { EnvConfig } from '../config/env';

@Injectable()
export class PrismaService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PrismaService.name);
  private readonly schemaName = 'aiverse_jobs';
  private readonly pool: Pool;
  private readonly client: PrismaClient;
  private connected = false;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    this.pool = new Pool({
      connectionString: this.config.get('databaseUrl', { infer: true }),
      max: this.config.get('dbPoolMax', { infer: true }),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    this.pool.on('error', (error) => this.logger.error('Unexpected PostgreSQL pool error', error));
    this.client = new PrismaClient({ adapter: new PrismaPg(this.pool) });
  }

  async onModuleInit() {
    await this.client.$connect();
    await this.client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${this.schemaName}"`);
    this.connected = true;
    this.logger.log('Prisma connected with pooled PostgreSQL runtime connection.');
  }

  get db() {
    return this.client;
  }

  isConnected() {
    return this.connected;
  }

  async ping() {
    await this.client.$queryRaw`SELECT 1`;
    return true;
  }

  async onApplicationShutdown() {
    await this.client.$disconnect();
    await this.pool.end();
    this.connected = false;
  }
}
