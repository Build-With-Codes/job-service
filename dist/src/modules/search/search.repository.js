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
exports.SearchRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const prisma_service_1 = require("../../database/prisma.service");
const jobs_repository_1 = require("../jobs/jobs.repository");
const CATEGORY_TERMS = {
    'ai-ml': [
        'ai',
        'artificial intelligence',
        'machine learning',
        'ml',
        'llm',
        'generative ai',
        'rag',
        'nlp',
        'computer vision',
        'deep learning',
        'prompt',
    ],
    software: [
        'software',
        'backend',
        'frontend',
        'full stack',
        'full-stack',
        'developer',
        'typescript',
        'javascript',
        'react',
        'mobile',
        'api',
    ],
    data: ['data', 'analytics', 'bi', 'business intelligence', 'etl', 'warehouse', 'scientist'],
    cloud: ['cloud', 'devops', 'platform', 'sre', 'site reliability', 'kubernetes', 'infrastructure'],
    security: ['security', 'cybersecurity', 'appsec', 'devsecops', 'threat', 'soc', 'red team', 'privacy'],
    'product-design': ['product manager', 'product designer', 'ux', 'ui', 'design', 'researcher'],
    'business-marketing': [
        'marketing',
        'sales',
        'growth',
        'customer success',
        'account executive',
        'business development',
        'partnership',
    ],
    other: [
        'robotics',
        'hardware',
        'fintech',
        'health',
        'biotech',
        'education',
        'climate',
        'aerospace',
        'manufacturing',
    ],
};
const EXPERIENCE_TERMS = {
    entry: ['entry', 'junior', 'graduate', 'intern', 'internship', 'associate'],
    mid: ['mid', 'mid-level', 'software engineer', 'developer', 'specialist'],
    senior: ['senior', 'sr.', 'sr ', 'lead'],
    staff: ['staff', 'principal', 'distinguished'],
    lead: ['lead', 'manager', 'director', 'head of'],
};
const DEFAULT_DISCOVERY_TERMS = [
    'ai',
    'artificial intelligence',
    'machine learning',
    'llm',
    'generative ai',
    'software engineer',
    'data engineer',
    'data scientist',
    'cloud engineer',
    'devops',
    'cybersecurity',
    'security engineer',
    'product manager',
    'product designer',
    'robotics',
    'platform engineer',
];
function normalizeFilterValue(value) {
    return value.trim().toLowerCase().replace(/&/g, '').replace(/\s+/g, '-');
}
function normalizeEnumFilterValue(value) {
    return value.trim().toUpperCase().replace(/[-\s]+/g, '_');
}
function textSearch(term) {
    return {
        OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { descriptionText: { contains: term, mode: 'insensitive' } },
            { company: { name: { contains: term, mode: 'insensitive' } } },
            { skills: { some: { skill: { name: { contains: term, mode: 'insensitive' } } } } },
        ],
    };
}
let SearchRepository = class SearchRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(input) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginate)(input.page, input.limit);
        const and = [];
        const locationFilters = [];
        if (input.country) {
            locationFilters.push({ countryCode: input.country.toUpperCase() });
        }
        if (input.city) {
            locationFilters.push({ city: { contains: input.city, mode: 'insensitive' } });
        }
        if (typeof input.remote === 'boolean') {
            locationFilters.push({ isRemote: input.remote });
        }
        if (input.location) {
            locationFilters.push({
                OR: [
                    { city: { contains: input.location, mode: 'insensitive' } },
                    { state: { contains: input.location, mode: 'insensitive' } },
                    { country: { contains: input.location, mode: 'insensitive' } },
                    { countryCode: { contains: input.location, mode: 'insensitive' } },
                ],
            });
        }
        if (locationFilters.length > 0) {
            and.push(...locationFilters.map((filter) => ({ locations: { some: filter } })));
        }
        if (input.q) {
            and.push(textSearch(input.q));
        }
        if (input.category && input.category !== 'all') {
            const normalizedCategory = normalizeFilterValue(input.category);
            const terms = CATEGORY_TERMS[normalizedCategory] ?? [input.category.replace(/-/g, ' ')];
            and.push({ OR: terms.map(textSearch) });
        }
        if (!input.q && (!input.category || input.category === 'all')) {
            and.push({ OR: DEFAULT_DISCOVERY_TERMS.map(textSearch) });
        }
        if (input.workplaceType && input.workplaceType.toLowerCase() !== 'remote') {
            and.push({
                OR: [
                    { workplaceType: { contains: input.workplaceType, mode: 'insensitive' } },
                    { descriptionText: { contains: input.workplaceType, mode: 'insensitive' } },
                ],
            });
        }
        if (input.experience) {
            const normalizedExperience = normalizeFilterValue(input.experience);
            const terms = EXPERIENCE_TERMS[normalizedExperience] ?? [input.experience];
            and.push({
                OR: terms.flatMap((term) => [
                    { title: { contains: term, mode: 'insensitive' } },
                    { descriptionText: { contains: term, mode: 'insensitive' } },
                ]),
            });
        }
        const where = {
            status: client_1.JobStatus.ACTIVE,
            ...(input.company ? { company: { slug: input.company } } : {}),
            ...(input.employmentType ? { employmentType: normalizeEnumFilterValue(input.employmentType) } : {}),
            ...(input.salaryMin ? { salaryMax: { gte: input.salaryMin } } : {}),
            ...(input.salaryMax ? { salaryMin: { lte: input.salaryMax } } : {}),
            ...(input.postedWithin
                ? { postedAt: { gte: new Date(Date.now() - input.postedWithin * 24 * 60 * 60 * 1000) } }
                : {}),
            ...(and.length > 0 ? { AND: and } : {}),
        };
        const orderBy = input.sort === 'salary'
            ? { salaryMax: 'desc' }
            : input.sort === 'newest'
                ? { postedAt: 'desc' }
                : { updatedAt: 'desc' };
        const [total, data] = await Promise.all([
            this.prisma.db.job.count({ where }),
            this.prisma.db.job.findMany({
                where,
                include: jobs_repository_1.publicJobInclude,
                skip,
                take,
                orderBy,
            }),
        ]);
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
};
exports.SearchRepository = SearchRepository;
exports.SearchRepository = SearchRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchRepository);
//# sourceMappingURL=search.repository.js.map