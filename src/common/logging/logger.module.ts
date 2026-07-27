import { Module } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        genReqId: (req) => req.headers['x-request-id']?.toString() ?? randomUUID(),
      },
    }),
  ],
})
export class StructuredLoggerModule {}
