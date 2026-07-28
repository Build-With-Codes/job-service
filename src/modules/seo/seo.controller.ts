import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SeoService } from './seo.service';

@ApiTags('seo')
@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get()
  async getSeo(
    @Query('type') type?: string,
    @Query('slug') slug?: string,
    @Query('query') query?: string,
  ) {
    return {
      data: await this.seoService.getSeo({ type, slug, query }),
    };
  }

  @Get('sitemap/:section')
  async getSitemap(@Param('section') section: string) {
    return {
      data: await this.seoService.getSitemap(section),
    };
  }
}
