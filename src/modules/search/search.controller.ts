import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchJobsDto } from './search.dto';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('jobs')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get('search')
  searchJobs(@Query() query: SearchJobsDto) {
    return this.search.search(query);
  }
}
