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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const queue_constants_1 = require("../../queues/queue.constants");
const admin_guard_1 = require("./admin.guard");
const admin_service_1 = require("./admin.service");
let AdminController = class AdminController {
    admin;
    providerSyncQueue;
    indexingQueue;
    constructor(admin, providerSyncQueue, indexingQueue) {
        this.admin = admin;
        this.providerSyncQueue = providerSyncQueue;
        this.indexingQueue = indexingQueue;
    }
    providers(query) {
        return this.admin.providers(query);
    }
    ingestionRuns(query) {
        return this.admin.ingestionRuns(query);
    }
    ingestionErrors(query) {
        return this.admin.ingestionErrors(query);
    }
    async sync(id, body) {
        const providerType = await this.admin.resolveProviderType(id, body.providerType);
        const job = await this.providerSyncQueue.add('admin-provider-sync', { providerType, requestedBy: 'admin' }, { jobId: `admin-provider-sync-${providerType}-${Date.now()}` });
        return { ok: true, queued: true, queue: queue_constants_1.PROVIDER_SYNC_QUEUE, jobId: job.id, providerType };
    }
    async reindex(id) {
        const job = await this.indexingQueue.add('admin-job-reindex', { jobId: id }, { jobId: `admin-job-reindex-${id}-${Date.now()}` });
        return { ok: true, queued: true, queue: queue_constants_1.JOB_INDEXING_QUEUE, jobId: job.id, job: id };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('providers'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "providers", null);
__decorate([
    (0, common_1.Get)('ingestion-runs'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "ingestionRuns", null);
__decorate([
    (0, common_1.Get)('ingestion-errors'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "ingestionErrors", null);
__decorate([
    (0, common_1.Post)('providers/:id/sync'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sync", null);
__decorate([
    (0, common_1.Post)('jobs/:id/reindex'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "reindex", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Controller)('admin'),
    __param(1, (0, bullmq_1.InjectQueue)(queue_constants_1.PROVIDER_SYNC_QUEUE)),
    __param(2, (0, bullmq_1.InjectQueue)(queue_constants_1.JOB_INDEXING_QUEUE)),
    __metadata("design:paramtypes", [admin_service_1.AdminService, Function, Function])
], AdminController);
//# sourceMappingURL=admin.controller.js.map