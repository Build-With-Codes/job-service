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
exports.DeduplicationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const url_1 = require("../../common/utils/url");
const fingerprint_service_1 = require("./fingerprint.service");
let DeduplicationService = class DeduplicationService {
    prisma;
    fingerprints;
    constructor(prisma, fingerprints) {
        this.prisma = prisma;
        this.fingerprints = fingerprints;
    }
    async check(providerId, input) {
        const providerSource = await this.prisma.db.jobSource.findUnique({
            where: {
                providerId_sourceJobId: {
                    providerId,
                    sourceJobId: input.sourceJobId,
                },
            },
        });
        if (providerSource)
            return { type: 'UPDATE', jobId: providerSource.jobId, confidence: 1 };
        const canonicalSourceUrl = (0, url_1.canonicalizeUrl)(input.sourceUrl);
        const urlSource = await this.prisma.db.jobSource.findFirst({
            where: { canonicalSourceUrl },
        });
        if (urlSource)
            return { type: 'DUPLICATE', jobId: urlSource.jobId, confidence: 0.98 };
        const fingerprint = this.fingerprints.create(input);
        const fingerprintMatch = await this.prisma.db.job.findFirst({
            where: { dedupeFingerprint: fingerprint },
            select: { id: true },
        });
        if (fingerprintMatch) {
            return { type: 'DUPLICATE', jobId: fingerprintMatch.id, confidence: 0.95 };
        }
        return { type: 'NEW' };
    }
};
exports.DeduplicationService = DeduplicationService;
exports.DeduplicationService = DeduplicationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fingerprint_service_1.FingerprintService])
], DeduplicationService);
//# sourceMappingURL=deduplication.service.js.map