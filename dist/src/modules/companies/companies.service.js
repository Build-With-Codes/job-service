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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const prisma_service_1 = require("../../database/prisma.service");
const jobs_repository_1 = require("../jobs/jobs.repository");
let CompaniesService = class CompaniesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(input) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginate)(input.page, input.limit);
        const [total, data] = await Promise.all([
            this.prisma.db.company.count(),
            this.prisma.db.company.findMany({
                skip,
                take,
                orderBy: { name: 'asc' },
            }),
        ]);
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    findBySlug(slug) {
        return this.prisma.db.company.findUnique({ where: { slug } });
    }
    async jobs(slug, input) {
        const company = await this.findBySlug(slug);
        if (!company)
            throw new common_1.NotFoundException('Company not found.');
        const { skip, take, page, limit } = (0, pagination_dto_1.paginate)(input.page, input.limit);
        const where = { companyId: company.id, status: client_1.JobStatus.ACTIVE };
        const [total, data] = await Promise.all([
            this.prisma.db.job.count({ where }),
            this.prisma.db.job.findMany({
                where,
                include: jobs_repository_1.publicJobInclude,
                skip,
                take,
                orderBy: { postedAt: 'desc' },
            }),
        ]);
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map