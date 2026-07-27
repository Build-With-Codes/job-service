"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../database/prisma.module");
const queue_module_1 = require("../../queues/queue.module");
const deduplication_module_1 = require("../deduplication/deduplication.module");
const normalization_module_1 = require("../normalization/normalization.module");
const providers_module_1 = require("../providers/providers.module");
const ingestion_run_service_1 = require("./ingestion-run.service");
const ingestion_service_1 = require("./ingestion.service");
let IngestionModule = class IngestionModule {
};
exports.IngestionModule = IngestionModule;
exports.IngestionModule = IngestionModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, queue_module_1.QueueModule, providers_module_1.ProvidersModule, normalization_module_1.NormalizationModule, deduplication_module_1.DeduplicationModule],
        providers: [ingestion_service_1.IngestionService, ingestion_run_service_1.IngestionRunService],
        exports: [ingestion_service_1.IngestionService, ingestion_run_service_1.IngestionRunService],
    })
], IngestionModule);
//# sourceMappingURL=ingestion.module.js.map