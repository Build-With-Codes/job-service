import { Injectable } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/pagination/pagination.dto';
import type { ListJobsDto } from './jobs.dto';

export const publicJobInclude = {
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
} satisfies Prisma.JobInclude;

@Injectable()
export class JobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(input: ListJobsDto) {
    const { skip, take, page, limit } = paginate(input.page, input.limit);
    const where: Prisma.JobWhereInput = {
      status: JobStatus.ACTIVE,
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
    const orderBy: Prisma.JobOrderByWithRelationInput =
      input.sort === 'oldest'
        ? { postedAt: 'asc' }
        : input.sort === 'updated'
          ? { updatedAt: 'desc' }
          : { postedAt: 'desc' };
    const [total, data] = await Promise.all([
      this.prisma.db.job.count({ where }),
      this.prisma.db.job.findMany({ where, include: publicJobInclude, skip, take, orderBy }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  findById(id: string) {
    return this.prisma.db.job.findFirst({
      where: { id, status: JobStatus.ACTIVE },
      include: publicJobInclude,
    });
  }

  findBySlug(slug: string) {
    return this.prisma.db.job.findFirst({
      where: { slug, status: JobStatus.ACTIVE },
      include: publicJobInclude,
    });
  }
}
