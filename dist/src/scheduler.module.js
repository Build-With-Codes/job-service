"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerModule = void 0;
const common_1 = require("@nestjs/common");
const configuration_module_1 = require("./config/configuration.module");
const logger_module_1 = require("./common/logging/logger.module");
const queue_module_1 = require("./queues/queue.module");
const ingestion_scheduler_1 = require("./modules/ingestion/ingestion.scheduler");
const prompts_module_1 = require("./modules/prompts/prompts.module");
const prompts_scheduler_1 = require("./modules/prompts/prompts.scheduler");
const bullSchedulerEnabled = process.env.BULL_SCHEDULER_ENABLED !== 'false';
const schedulerImports = bullSchedulerEnabled
    ? [configuration_module_1.ConfigurationModule, logger_module_1.StructuredLoggerModule, queue_module_1.QueueModule, prompts_module_1.PromptsModule]
    : [configuration_module_1.ConfigurationModule, logger_module_1.StructuredLoggerModule, prompts_module_1.PromptsModule];
const schedulerProviders = bullSchedulerEnabled
    ? [ingestion_scheduler_1.IngestionScheduler, prompts_scheduler_1.PromptsScheduler]
    : [prompts_scheduler_1.PromptsScheduler];
let SchedulerModule = class SchedulerModule {
};
exports.SchedulerModule = SchedulerModule;
exports.SchedulerModule = SchedulerModule = __decorate([
    (0, common_1.Module)({
        imports: schedulerImports,
        providers: schedulerProviders,
    })
], SchedulerModule);
//# sourceMappingURL=scheduler.module.js.map