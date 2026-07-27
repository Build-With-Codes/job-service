import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { QueueModule } from '../../queues/queue.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [AdminController],
  providers: [AdminGuard, AdminService],
})
export class AdminModule {}
