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
var ProviderSyncWorker_1, JobExpirationWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobExpirationWorker = exports.ProviderSyncWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const queue_constants_1 = require("../../queues/queue.constants");
const ingestion_service_1 = require("./ingestion.service");
let ProviderSyncWorker = ProviderSyncWorker_1 = class ProviderSyncWorker extends bullmq_1.WorkerHost {
    ingestion;
    logger = new common_1.Logger(ProviderSyncWorker_1.name);
    constructor(ingestion) {
        super();
        this.ingestion = ingestion;
    }
    async process(job) {
        this.logger.log(`Provider sync worker received job: jobId=${job.id} provider=${job.data.providerType} requestedBy=${job.data.requestedBy}`);
        try {
            const result = await this.ingestion.syncProvider(job.data.providerType);
            this.logger.log(`Provider sync worker completed job: jobId=${job.id} provider=${job.data.providerType} result=${JSON.stringify(result)}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Provider sync worker failed job: jobId=${job.id} provider=${job.data.providerType} error=${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
};
exports.ProviderSyncWorker = ProviderSyncWorker;
exports.ProviderSyncWorker = ProviderSyncWorker = ProviderSyncWorker_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.PROVIDER_SYNC_QUEUE, { concurrency: 2 }),
    __metadata("design:paramtypes", [ingestion_service_1.IngestionService])
], ProviderSyncWorker);
let JobExpirationWorker = JobExpirationWorker_1 = class JobExpirationWorker extends bullmq_1.WorkerHost {
    ingestion;
    logger = new common_1.Logger(JobExpirationWorker_1.name);
    constructor(ingestion) {
        super();
        this.ingestion = ingestion;
    }
    async process(job) {
        this.logger.log(`Job expiration worker received job: jobId=${job.id}`);
        const result = await this.ingestion.expireMissingJobs();
        this.logger.log(`Job expiration worker completed job: jobId=${job.id} result=${JSON.stringify(result)}`);
        return result;
    }
};
exports.JobExpirationWorker = JobExpirationWorker;
exports.JobExpirationWorker = JobExpirationWorker = JobExpirationWorker_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.JOB_EXPIRATION_QUEUE, { concurrency: 1 }),
    __metadata("design:paramtypes", [ingestion_service_1.IngestionService])
], JobExpirationWorker);
//# sourceMappingURL=ingestion.worker.js.map