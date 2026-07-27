import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { SearchModule } from '../search/search.module';
import { JobsController } from './jobs.controller';
import { JobsRepository } from './jobs.repository';
import { JobsService } from './jobs.service';

@Module({
  imports: [PrismaModule, SearchModule],
  controllers: [JobsController],
  providers: [JobsRepository, JobsService],
  exports: [JobsRepository, JobsService],
})
export class JobsModule {}
