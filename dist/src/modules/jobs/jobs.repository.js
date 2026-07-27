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
exports.JobsRepository = exports.publicJobInclude = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
exports.publicJobInclude = {
    company: true,
    locations: true,
    sources: {
        select: {
            sourceUrl: true,
            applyUrl: true,
            provider: { select: { name: true, type: true } },
        },
    },
    skills: {
        include: { skill: true },
    },
};
let JobsRepository = class JobsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(input) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginate)(input.page, input.limit);
        const where = {
            status: client_1.JobStatus.ACTIVE,
            ...(input.company
                ? { company: { slug: input.company } }
                : {}),
            ...(input.employmentType ? { employmentType: input.employmentType.toUpperCase() } : {}),
            ...(input.country
                ? { locations: { some: { countryCode: input.country.toUpperCase() } } }
                : {}),
            ...(typeof input.remote === 'boolean'
                ? { locations: { some: { isRemote: input.remote } } }
                : {}),
        };
        const orderBy = input.sort === 'oldest'
            ? { postedAt: 'asc' }
            : input.sort === 'updated'
                ? { updatedAt: 'desc' }
                : { postedAt: 'desc' };
        const [total, data] = await Promise.all([
            this.prisma.db.job.count({ where }),
            this.prisma.db.job.findMany({ where, include: exports.publicJobInclude, skip, take, orderBy }),
        ]);
        return {
            data,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    findById(id) {
        return this.prisma.db.job.findFirst({
            where: { id, status: client_1.JobStatus.ACTIVE },
            include: exports.publicJobInclude,
        });
    }
    findBySlug(slug) {
        return this.prisma.db.job.findFirst({
            where: { slug, status: client_1.JobStatus.ACTIVE },
            include: exports.publicJobInclude,
        });
    }
};
exports.JobsRepository = JobsRepository;
exports.JobsRepository = JobsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobsRepository);
//# sourceMappingURL=jobs.repository.js.map