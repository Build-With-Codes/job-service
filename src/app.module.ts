import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigurationModule } from './config/configuration.module';
import { RequestIdMiddleware } from './common/logging/request-id.middleware';
import { StructuredLoggerModule } from './common/logging/logger.module';
import { PrismaModule } from './database/prisma.module';
import { QueueModule } from './queues/queue.module';
import { HealthModule } from './modules/health/health.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { SearchModule } from './modules/search/search.module';
import { AdminModule } from './modules/admin/admin.module';
import { PromptsModule } from './modules/prompts/prompts.module';

@Module({
  imports: [
    ConfigurationModule,
    StructuredLoggerModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    QueueModule,
    HealthModule,
    JobsModule,
    CompaniesModule,
    SearchModule,
    PromptsModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
