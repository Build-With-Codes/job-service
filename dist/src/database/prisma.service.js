"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
let PrismaService = PrismaService_1 = class PrismaService {
    config;
    logger = new common_1.Logger(PrismaService_1.name);
    schemaName = 'aiverse_jobs';
    pool;
    client;
    connected = false;
    lastError = null;
    runtimeConnectionHost;
    constructor(config) {
        this.config = config;
        const databaseUrl = this.resolveDatabaseUrl();
        this.runtimeConnectionHost = this.extractConnectionHost(databaseUrl);
        this.pool = new pg_1.Pool({
            connectionString: databaseUrl,
            max: this.config.get('dbPoolMax', { infer: true }),
            idleTimeoutMillis: 10_000,
            connectionTimeoutMillis: 5_000,
        });
        this.pool.on('error', (error) => this.logger.error('Unexpected PostgreSQL pool error', error));
        this.client = new client_1.PrismaClient({ adapter: new adapter_pg_1.PrismaPg(this.pool) });
    }
    async onModuleInit() {
        try {
            await this.client.$connect();
            await this.client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${this.schemaName}"`);
            this.connected = true;
            this.lastError = null;
            this.logger.log('Prisma connected with pooled PostgreSQL runtime connection.');
        }
        catch (error) {
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
            await this.client.$queryRaw `SELECT 1`;
            this.connected = true;
            this.lastError = null;
            return true;
        }
        catch (error) {
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
    resolveDatabaseUrl() {
        const configuredUrl = this.config.get('databaseUrl', { infer: true });
        try {
            const url = new URL(configuredUrl);
            url.searchParams.set('schema', this.schemaName);
            return url.toString();
        }
        catch {
            return configuredUrl;
        }
    }
    extractConnectionHost(connectionString) {
        try {
            const url = new URL(connectionString);
            return `${url.hostname}:${url.port || 'default'}`;
        }
        catch {
            return null;
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map