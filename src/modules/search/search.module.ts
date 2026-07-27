import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { SearchController } from './search.controller';
import { SearchIndexService } from './search-index.service';
import { SearchRepository } from './search.repository';
import { SearchService } from './search.service';

@Module({
  imports: [PrismaModule],
  controllers: [SearchController],
  providers: [SearchRepository, SearchService, SearchIndexService],
  exports: [SearchService, SearchIndexService],
})
export class SearchModule {}
