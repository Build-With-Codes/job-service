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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionRunService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let IngestionRunService = class IngestionRunService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(providerId) {
        return this.prisma.db.ingestionRun.create({
            data: { providerId, status: client_1.IngestionRunStatus.RUNNING },
        });
    }
    recordError(input) {
        return this.prisma.db.ingestionError.create({
            data: input,
        });
    }
    complete(id, status, counters) {
        return this.prisma.db.ingestionRun.update({
            where: { id },
            data: {
                status,
                completedAt: new Date(),
                jobsFetched: counters.jobsFetched ?? 0,
                jobsCreated: counters.jobsCreated ?? 0,
                jobsUpdated: counters.jobsUpdated ?? 0,
                jobsSkipped: counters.jobsSkipped ?? 0,
                jobsExpired: counters.jobsExpired ?? 0,
                jobsFailed: counters.jobsFailed ?? 0,
                errorMessage: counters.errorMessage,
            },
        });
    }
};
exports.IngestionRunService = IngestionRunService;
exports.IngestionRunService = IngestionRunService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IngestionRunService);
//# sourceMappingURL=ingestion-run.service.js.map