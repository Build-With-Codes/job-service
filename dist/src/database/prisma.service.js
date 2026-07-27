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
    constructor(config) {
        this.config = config;
        this.pool = new pg_1.Pool({
            connectionString: this.config.get('databaseUrl', { infer: true }),
            max: this.config.get('dbPoolMax', { infer: true }),
            idleTimeoutMillis: 10_000,
            connectionTimeoutMillis: 5_000,
        });
        this.pool.on('error', (error) => this.logger.error('Unexpected PostgreSQL pool error', error));
        this.client = new client_1.PrismaClient({ adapter: new adapter_pg_1.PrismaPg(this.pool) });
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
        await this.client.$queryRaw `SELECT 1`;
        return true;
    }
    async onApplicationShutdown() {
        await this.client.$disconnect();
        await this.pool.end();
        this.connected = false;
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map