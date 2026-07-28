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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var IngestionScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionScheduler = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const queue_constants_1 = require("../../queues/queue.constants");
let IngestionScheduler = IngestionScheduler_1 = class IngestionScheduler {
    providerSyncQueue;
    expirationQueue;
    outboxQueue;
    logger = new common_1.Logger(IngestionScheduler_1.name);
    constructor(providerSyncQueue, expirationQueue, outboxQueue) {
        this.providerSyncQueue = providerSyncQueue;
        this.expirationQueue = expirationQueue;
        this.outboxQueue = outboxQueue;
    }
    async onModuleInit() {
        console.log('[scheduler] IngestionScheduler initialization started.');
        const providerSyncCron = process.env.PROVIDER_SYNC_CRON ?? '*/3 * * * *';
        const expirationCron = process.env.JOB_EXPIRATION_CRON ?? '0 * * * *';
        const outboxCron = process.env.OUTBOX_CRON ?? '* * * * *';
        const syncOnStartup = process.env.PROVIDER_SYNC_ON_STARTUP === 'true';
        const providers = (process.env.PROVIDER_SYNC_TYPES ?? 'greenhouse,arbeitnow')
            .split(',')
            .map((provider) => provider.trim())
            .filter(Boolean);
        for (const providerType of providers) {
            await this.withTimeout(`register ${providerType} provider sync repeatable job`, this.providerSyncQueue.add(`${providerType}-provider-sync`, { providerType, requestedBy: 'scheduler' }, { repeat: { pattern: providerSyncCron }, jobId: `${providerType}-provider-sync` }));
            this.logger.log(`Registered repeatable provider sync: provider=${providerType} queue=${queue_constants_1.PROVIDER_SYNC_QUEUE} cron="${providerSyncCron}"`);
            if (syncOnStartup) {
                await this.withTimeout(`register immediate ${providerType} provider sync startup job`, this.providerSyncQueue.add(`${providerType}-provider-sync-now`, { providerType, requestedBy: 'scheduler' }, { jobId: `${providerType}-provider-sync-now-${Date.now()}`, attempts: 1 }));
                this.logger.log(`Queued immediate provider sync startup job: provider=${providerType} queue=${queue_constants_1.PROVIDER_SYNC_QUEUE}`);
            }
            else {
                this.logger.log(`Skipped immediate provider sync startup job: provider=${providerType}; enable PROVIDER_SYNC_ON_STARTUP=true to run it.`);
            }
        }
        await this.withTimeout('register job expiration repeatable job', this.expirationQueue.add('job-expiration', { requestedBy: 'scheduler' }, { repeat: { pattern: expirationCron }, jobId: 'job-expiration' }));
        this.logger.log(`Registered repeatable job expiration: queue=${queue_constants_1.JOB_EXPIRATION_QUEUE} cron="${expirationCron}"`);
        await this.withTimeout('register outbox repeatable job', this.outboxQueue.add('outbox-processing', { requestedBy: 'scheduler' }, { repeat: { pattern: outboxCron }, jobId: 'outbox-processing' }));
        this.logger.log(`Registered repeatable outbox processing: queue=${queue_constants_1.OUTBOX_PROCESSING_QUEUE} cron="${outboxCron}"`);
        console.log('[scheduler] IngestionScheduler initialization completed.');
    }
    async withTimeout(label, promise) {
        console.log(`[scheduler] Starting queue operation: ${label}`);
        let timeout;
        try {
            const result = await Promise.race([
                promise,
                new Promise((_, reject) => {
                    timeout = setTimeout(() => reject(new Error(`Timed out after 10s: ${label}`)), 10_000);
                }),
            ]);
            console.log(`[scheduler] Completed queue operation: ${label}`);
            return result;
        }
        catch (error) {
            console.error(`[scheduler] Failed queue operation: ${label}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
        finally {
            if (timeout)
                clearTimeout(timeout);
        }
    }
};
exports.IngestionScheduler = IngestionScheduler;
exports.IngestionScheduler = IngestionScheduler = IngestionScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)(queue_constants_1.PROVIDER_SYNC_QUEUE)),
    __param(1, (0, bullmq_1.InjectQueue)(queue_constants_1.JOB_EXPIRATION_QUEUE)),
    __param(2, (0, bullmq_1.InjectQueue)(queue_constants_1.OUTBOX_PROCESSING_QUEUE)),
    __metadata("design:paramtypes", [Function, Function, Function])
], IngestionScheduler);
//# sourceMappingURL=ingestion.scheduler.js.map