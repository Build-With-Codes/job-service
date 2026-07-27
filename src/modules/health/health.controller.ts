import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('health')
  healthCheck() {
    return this.health.health();
  }

  @Get('ready')
  readyCheck() {
    return this.health.ready();
  }
}
