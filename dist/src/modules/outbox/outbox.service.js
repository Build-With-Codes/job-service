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
var OutboxService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const queue_constants_1 = require("../../queues/queue.constants");
const prisma_service_1 = require("../../database/prisma.service");
let OutboxService = OutboxService_1 = class OutboxService {
    prisma;
    indexingQueue;
    logger = new common_1.Logger(OutboxService_1.name);
    constructor(prisma, indexingQueue) {
        this.prisma = prisma;
        this.indexingQueue = indexingQueue;
    }
    async processPending(limit = 100) {
        this.logger.log(`Outbox processing scan starting: limit=${limit}`);
        const events = await this.prisma.db.outboxEvent.findMany({
            where: { processedAt: null },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
        this.logger.log(`Outbox pending events found: count=${events.length}`);
        for (const event of events) {
            const payload = event.payload;
            if (payload.jobId) {
                this.logger.log(`Queueing search indexing from outbox: eventId=${event.id} eventType=${event.eventType} jobId=${payload.jobId}`);
                await this.indexingQueue.add('job-index', { jobId: payload.jobId, eventId: event.id }, { jobId: `job-index-${event.id}` });
            }
            await this.prisma.db.outboxEvent.update({
                where: { id: event.id },
                data: { processedAt: new Date() },
            });
            this.logger.log(`Outbox event marked processed: eventId=${event.id}`);
        }
        this.logger.log(`Outbox processing scan complete: processed=${events.length}`);
        return { processed: events.length };
    }
};
exports.OutboxService = OutboxService;
exports.OutboxService = OutboxService = OutboxService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)(queue_constants_1.JOB_INDEXING_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Function])
], OutboxService);
//# sourceMappingURL=outbox.service.js.map