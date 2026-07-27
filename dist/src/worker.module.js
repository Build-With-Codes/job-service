"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerModule = void 0;
const common_1 = require("@nestjs/common");
const configuration_module_1 = require("./config/configuration.module");
const logger_module_1 = require("./common/logging/logger.module");
const prisma_module_1 = require("./database/prisma.module");
const queue_module_1 = require("./queues/queue.module");
const providers_module_1 = require("./modules/providers/providers.module");
const normalization_module_1 = require("./modules/normalization/normalization.module");
const deduplication_module_1 = require("./modules/deduplication/deduplication.module");
const ingestion_module_1 = require("./modules/ingestion/ingestion.module");
const ingestion_worker_1 = require("./modules/ingestion/ingestion.worker");
const outbox_module_1 = require("./modules/outbox/outbox.module");
const search_module_1 = require("./modules/search/search.module");
let WorkerModule = class WorkerModule {
};
exports.WorkerModule = WorkerModule;
exports.WorkerModule = WorkerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            configuration_module_1.ConfigurationModule,
            logger_module_1.StructuredLoggerModule,
            prisma_module_1.PrismaModule,
            queue_module_1.QueueModule,
            providers_module_1.ProvidersModule,
            normalization_module_1.NormalizationModule,
            deduplication_module_1.DeduplicationModule,
            search_module_1.SearchModule,
            ingestion_module_1.IngestionModule,
            outbox_module_1.OutboxModule,
        ],
        providers: [ingestion_worker_1.ProviderSyncWorker, ingestion_worker_1.JobExpirationWorker],
    })
], WorkerModule);
//# sourceMappingURL=worker.module.js.map