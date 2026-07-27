"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const configuration_module_1 = require("./config/configuration.module");
const request_id_middleware_1 = require("./common/logging/request-id.middleware");
const logger_module_1 = require("./common/logging/logger.module");
const prisma_module_1 = require("./database/prisma.module");
const queue_module_1 = require("./queues/queue.module");
const health_module_1 = require("./modules/health/health.module");
const jobs_module_1 = require("./modules/jobs/jobs.module");
const companies_module_1 = require("./modules/companies/companies.module");
const search_module_1 = require("./modules/search/search.module");
const admin_module_1 = require("./modules/admin/admin.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_id_middleware_1.RequestIdMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            configuration_module_1.ConfigurationModule,
            logger_module_1.StructuredLoggerModule,
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
            prisma_module_1.PrismaModule,
            queue_module_1.QueueModule,
            health_module_1.HealthModule,
            jobs_module_1.JobsModule,
            companies_module_1.CompaniesModule,
            search_module_1.SearchModule,
            admin_module_1.AdminModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map