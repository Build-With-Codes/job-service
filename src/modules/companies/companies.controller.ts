import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { CompaniesService } from './companies.service';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.companies.list(query);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const company = await this.companies.findBySlug(slug);
    if (!company) throw new NotFoundException('Company not found.');
    return company;
  }

  @Get(':slug/jobs')
  jobs(@Param('slug') slug: string, @Query() query: PaginationDto) {
    return this.companies.jobs(slug, query);
  }
}
