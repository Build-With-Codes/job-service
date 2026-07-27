import { InjectQueue } from '@nestjs/bullmq';
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Queue } from 'bullmq';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { JOB_INDEXING_QUEUE, PROVIDER_SYNC_QUEUE } from '../../queues/queue.constants';
import type { JobIndexingJob, ProviderSyncJob } from '../../queues/queue.types';
import { SyncProviderDto } from '../ingestion/ingestion.dto';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    @InjectQueue(PROVIDER_SYNC_QUEUE) private readonly providerSyncQueue: Queue<ProviderSyncJob>,
    @InjectQueue(JOB_INDEXING_QUEUE) private readonly indexingQueue: Queue<JobIndexingJob>,
  ) {}

  @Get('providers')
  providers(@Query() query: PaginationDto) {
    return this.admin.providers(query);
  }

  @Get('ingestion-runs')
  ingestionRuns(@Query() query: PaginationDto) {
    return this.admin.ingestionRuns(query);
  }

  @Get('ingestion-errors')
  ingestionErrors(@Query() query: PaginationDto) {
    return this.admin.ingestionErrors(query);
  }

  @Post('providers/:id/sync')
  async sync(@Param('id') id: string, @Body() body: Partial<SyncProviderDto>) {
    const providerType = await this.admin.resolveProviderType(id, body.providerType);
    const job = await this.providerSyncQueue.add(
      'admin-provider-sync',
      { providerType, requestedBy: 'admin' },
      { jobId: `admin-provider-sync-${providerType}-${Date.now()}` },
    );
    return { ok: true, queued: true, queue: PROVIDER_SYNC_QUEUE, jobId: job.id, providerType };
  }

  @Post('jobs/:id/reindex')
  async reindex(@Param('id') id: string) {
    const job = await this.indexingQueue.add('admin-job-reindex', { jobId: id }, { jobId: `admin-job-reindex-${id}-${Date.now()}` });
    return { ok: true, queued: true, queue: JOB_INDEXING_QUEUE, jobId: job.id, job: id };
  }
}
