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
var SearchIndexService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchIndexService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let SearchIndexService = SearchIndexService_1 = class SearchIndexService {
    prisma;
    logger = new common_1.Logger(SearchIndexService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async reindexJob(jobId) {
        await this.prisma.db.$executeRaw `
      UPDATE "aiverse_jobs"."Job"
      SET "searchVector" =
        setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
        setweight(to_tsvector('english', coalesce("descriptionText", '')), 'B') ||
        setweight(to_tsvector('english', coalesce("employmentType", '')), 'C') ||
        setweight(to_tsvector('english', coalesce("workplaceType", '')), 'C')
      WHERE "id" = ${jobId}
    `;
        this.logger.log(`Search index refreshed for job ${jobId}`);
    }
};
exports.SearchIndexService = SearchIndexService;
exports.SearchIndexService = SearchIndexService = SearchIndexService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchIndexService);
//# sourceMappingURL=search-index.service.js.map