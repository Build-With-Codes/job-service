import { Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { paginate, PaginationDto } from '../../common/pagination/pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import { publicJobInclude } from '../jobs/jobs.repository';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(input: PaginationDto) {
    const { skip, take, page, limit } = paginate(input.page, input.limit);
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

  findBySlug(slug: string) {
    return this.prisma.db.company.findUnique({ where: { slug } });
  }

  async jobs(slug: string, input: PaginationDto) {
    const company = await this.findBySlug(slug);
    if (!company) throw new NotFoundException('Company not found.');
    const { skip, take, page, limit } = paginate(input.page, input.limit);
    const where = { companyId: company.id, status: JobStatus.ACTIVE };
    const [total, data] = await Promise.all([
      this.prisma.db.job.count({ where }),
      this.prisma.db.job.findMany({
        where,
        include: publicJobInclude,
        skip,
        take,
        orderBy: { postedAt: 'desc' },
      }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
