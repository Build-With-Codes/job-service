import { Injectable } from '@nestjs/common';
import { paginate, PaginationDto } from '../../common/pagination/pagination.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async providers(input: PaginationDto) {
    const { skip, take, page, limit } = paginate(input.page, input.limit);
    const [total, data] = await Promise.all([
      this.prisma.db.provider.count(),
      this.prisma.db.provider.findMany({ skip, take, orderBy: { updatedAt: 'desc' } }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async ingestionRuns(input: PaginationDto) {
    const { skip, take, page, limit } = paginate(input.page, input.limit);
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

  async ingestionErrors(input: PaginationDto) {
    const { skip, take, page, limit } = paginate(input.page, input.limit);
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

  async resolveProviderType(idOrType: string, override?: string) {
    if (override) return override;
    const provider = await this.prisma.db.provider.findFirst({
      where: {
        OR: [{ id: idOrType }, { type: idOrType }],
      },
      select: { type: true },
    });
    return provider?.type ?? idOrType;
  }
}
