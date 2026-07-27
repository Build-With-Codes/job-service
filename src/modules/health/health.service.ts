import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return {
      ok: true,
      service: 'aiverseworld-job-service',
      timestamp: new Date().toISOString(),
    };
  }

  async ready() {
    const database = await this.prisma.ping();
    return {
      ok: database,
      database,
      prisma: this.prisma.getStatus(),
      timestamp: new Date().toISOString(),
    };
  }
}
