import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { DeduplicationService } from './deduplication.service';
import { FingerprintService } from './fingerprint.service';

@Module({
  imports: [PrismaModule],
  providers: [FingerprintService, DeduplicationService],
  exports: [FingerprintService, DeduplicationService],
})
export class DeduplicationModule {}
