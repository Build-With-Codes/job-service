import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchJobsDto } from '../search/search.dto';
import { SearchService } from '../search/search.service';
import { ListJobsDto } from './jobs.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobs: JobsService,
    private readonly search: SearchService,
  ) {}

  @Get()
  list(@Query() query: ListJobsDto) {
    return this.jobs.list(query);
  }

  @Get('search')
  searchJobs(@Query() query: SearchJobsDto) {
    return this.search.search(query);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.jobs.findBySlug(slug);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.jobs.findById(id);
  }
}
