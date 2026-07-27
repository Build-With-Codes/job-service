"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../database/prisma.module");
const search_module_1 = require("../search/search.module");
const jobs_controller_1 = require("./jobs.controller");
const jobs_repository_1 = require("./jobs.repository");
const jobs_service_1 = require("./jobs.service");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, search_module_1.SearchModule],
        controllers: [jobs_controller_1.JobsController],
        providers: [jobs_repository_1.JobsRepository, jobs_service_1.JobsService],
        exports: [jobs_repository_1.JobsRepository, jobs_service_1.JobsService],
    })
], JobsModule);
//# sourceMappingURL=jobs.module.js.map