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
  private lastError: string | null = null;
  private readonly runtimeConnectionHost: string | null;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    const databaseUrl = this.resolveDatabaseUrl();
    this.runtimeConnectionHost = this.extractConnectionHost(databaseUrl);
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: this.config.get('dbPoolMax', { infer: true }),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    this.pool.on('error', (error) => this.logger.error('Unexpected PostgreSQL pool error', error));
    this.client = new PrismaClient({ adapter: new PrismaPg(this.pool) });
  }

  async onModuleInit() {
    try {
      await this.client.$connect();
      await this.client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${this.schemaName}"`);
      this.connected = true;
      this.lastError = null;
      this.logger.log('Prisma connected with pooled PostgreSQL runtime connection.');
    } catch (error) {
      this.connected = false;
      this.lastError = error instanceof Error ? error.message : String(error);
      this.logger.error(`Prisma connection failed. API will still start, but database-backed routes are unavailable: ${this.lastError}`);
    }
  }

  get db() {
    return this.client;
  }

  isConnected() {
    return this.connected;
  }

  getStatus() {
    return {
      configured: Boolean(this.config.get('databaseUrl', { infer: true })?.trim()),
      connected: this.connected,
      lastError: this.lastError,
      runtimeConnection: {
        type: 'pooled',
        env: 'DATABASE_URL',
        host: this.runtimeConnectionHost,
        poolMax: this.config.get('dbPoolMax', { infer: true }),
      },
      migrationConnection: {
        type: 'direct',
        env: this.config.get('directUrl', { infer: true }) ? 'DIRECT_URL' : null,
        configured: Boolean(this.config.get('directUrl', { infer: true })?.trim()),
      },
    };
  }

  async ping() {
    try {
      await this.client.$queryRaw`SELECT 1`;
      this.connected = true;
      this.lastError = null;
      return true;
    } catch (error) {
      this.connected = false;
      this.lastError = error instanceof Error ? error.message : String(error);
      return false;
    }
  }

  async onApplicationShutdown() {
    await this.client.$disconnect();
    await this.pool.end();
    this.connected = false;
  }

  private resolveDatabaseUrl() {
    const configuredUrl = this.config.get('databaseUrl', { infer: true });

    try {
      const url = new URL(configuredUrl);
      url.searchParams.set('schema', this.schemaName);
      return url.toString();
    } catch {
      return configuredUrl;
    }
  }

  private extractConnectionHost(connectionString: string) {
    try {
      const url = new URL(connectionString);
      return `${url.hostname}:${url.port || 'default'}`;
    } catch {
      return null;
    }
  }
}
