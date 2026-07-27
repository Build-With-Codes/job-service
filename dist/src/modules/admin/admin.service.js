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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const prisma_service_1 = require("../../database/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async providers(input) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginate)(input.page, input.limit);
        const [total, data] = await Promise.all([
            this.prisma.db.provider.count(),
            this.prisma.db.provider.findMany({ skip, take, orderBy: { updatedAt: 'desc' } }),
        ]);
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async ingestionRuns(input) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginate)(input.page, input.limit);
        const [total, data] = await Promise.all([
            this.prisma.db.ingestionRun.count(),
            this.prisma.db.ingestionRun.findMany({
                skip,
                take,
                include: { provider: true },
                orderBy: { startedAt: 'desc' },
            }),
        ]);
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async ingestionErrors(input) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginate)(input.page, input.limit);
        const [total, data] = await Promise.all([
            this.prisma.db.ingestionError.count(),
            this.prisma.db.ingestionError.findMany({
                skip,
                take,
                include: { ingestionRun: true },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    async resolveProviderType(idOrType, override) {
        if (override)
            return override;
        const provider = await this.prisma.db.provider.findFirst({
            where: {
                OR: [{ id: idOrType }, { type: idOrType }],
            },
            select: { type: true },
        });
        return provider?.type ?? idOrType;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map