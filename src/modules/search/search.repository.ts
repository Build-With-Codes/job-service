import { Injectable } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { paginate } from '../../common/pagination/pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import { publicJobInclude } from '../jobs/jobs.repository';
import type { SearchJobsDto } from './search.dto';

const CATEGORY_TERMS: Record<string, string[]> = {
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

const EXPERIENCE_TERMS: Record<string, string[]> = {
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

function normalizeFilterValue(value: string) {
  return value.trim().toLowerCase().replace(/&/g, '').replace(/\s+/g, '-');
}

function normalizeEnumFilterValue(value: string) {
  return value.trim().toUpperCase().replace(/[-\s]+/g, '_');
}

function textSearch(term: string): Prisma.JobWhereInput {
  return {
    OR: [
      { title: { contains: term, mode: 'insensitive' } },
      { descriptionText: { contains: term, mode: 'insensitive' } },
      { company: { name: { contains: term, mode: 'insensitive' } } },
      { skills: { some: { skill: { name: { contains: term, mode: 'insensitive' } } } } },
    ],
  };
}

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(input: SearchJobsDto) {
    const { skip, take, page, limit } = paginate(input.page, input.limit);
    const and: Prisma.JobWhereInput[] = [];
    const locationFilters: Prisma.JobLocationWhereInput[] = [];

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

    const where: Prisma.JobWhereInput = {
      status: JobStatus.ACTIVE,
      ...(input.company ? { company: { slug: input.company } } : {}),
      ...(input.employmentType ? { employmentType: normalizeEnumFilterValue(input.employmentType) } : {}),
      ...(input.salaryMin ? { salaryMax: { gte: input.salaryMin } } : {}),
      ...(input.salaryMax ? { salaryMin: { lte: input.salaryMax } } : {}),
      ...(input.postedWithin
        ? { postedAt: { gte: new Date(Date.now() - input.postedWithin * 24 * 60 * 60 * 1000) } }
        : {}),
      ...(and.length > 0 ? { AND: and } : {}),
    };
    const orderBy: Prisma.JobOrderByWithRelationInput =
      input.sort === 'salary'
        ? { salaryMax: 'desc' }
        : input.sort === 'newest'
          ? { postedAt: 'desc' }
          : { updatedAt: 'desc' };
    const [total, data] = await Promise.all([
      this.prisma.db.job.count({ where }),
      this.prisma.db.job.findMany({
        where,
        include: publicJobInclude,
        skip,
        take,
        orderBy,
      }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
