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
var OutboxWorker_1, JobIndexingWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobIndexingWorker = exports.OutboxWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const queue_constants_1 = require("../../queues/queue.constants");
const search_index_service_1 = require("../search/search-index.service");
const outbox_service_1 = require("./outbox.service");
let OutboxWorker = OutboxWorker_1 = class OutboxWorker extends bullmq_1.WorkerHost {
    outbox;
    logger = new common_1.Logger(OutboxWorker_1.name);
    constructor(outbox) {
        super();
        this.outbox = outbox;
    }
    async process(job) {
        this.logger.log(`Outbox worker received job: jobId=${job.id} requestedBy=${job.data.requestedBy}`);
        const result = await this.outbox.processPending();
        this.logger.log(`Outbox worker completed job: jobId=${job.id} result=${JSON.stringify(result)}`);
        return result;
    }
};
exports.OutboxWorker = OutboxWorker;
exports.OutboxWorker = OutboxWorker = OutboxWorker_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.OUTBOX_PROCESSING_QUEUE, { concurrency: 1 }),
    __metadata("design:paramtypes", [outbox_service_1.OutboxService])
], OutboxWorker);
let JobIndexingWorker = JobIndexingWorker_1 = class JobIndexingWorker extends bullmq_1.WorkerHost {
    searchIndex;
    logger = new common_1.Logger(JobIndexingWorker_1.name);
    constructor(searchIndex) {
        super();
        this.searchIndex = searchIndex;
    }
    async process(job) {
        this.logger.log(`Search indexing worker received job: jobId=${job.id} targetJobId=${job.data.jobId}`);
        const result = await this.searchIndex.reindexJob(job.data.jobId);
        this.logger.log(`Search indexing worker completed job: jobId=${job.id} targetJobId=${job.data.jobId}`);
        return result;
    }
};
exports.JobIndexingWorker = JobIndexingWorker;
exports.JobIndexingWorker = JobIndexingWorker = JobIndexingWorker_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.JOB_INDEXING_QUEUE, { concurrency: 4 }),
    __metadata("design:paramtypes", [search_index_service_1.SearchIndexService])
], JobIndexingWorker);
//# sourceMappingURL=outbox.worker.js.map