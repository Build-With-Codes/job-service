import { Injectable, NotFoundException } from '@nestjs/common';
import type { ListJobsDto } from './jobs.dto';
import { JobsRepository } from './jobs.repository';

@Injectable()
export class JobsService {
  constructor(private readonly jobs: JobsRepository) {}

  list(input: ListJobsDto) {
    return this.jobs.list(input);
  }

  async findById(id: string) {
    const job = await this.jobs.findById(id);
    if (!job) throw new NotFoundException('Job not found.');
    return job;
  }

  async findBySlug(slug: string) {
    const job = await this.jobs.findBySlug(slug);
    if (!job) throw new NotFoundException('Job not found.');
    return job;
  }
}
