import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { EnvConfig } from '../../config/env';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  canActivate(context: ExecutionContext) {
    const expected = this.config.get('adminApiKey', { infer: true });
    if (!expected) {
      throw new UnauthorizedException('Admin API key is not configured.');
    }
    const request = context.switchToHttp().getRequest<Request>();
    const raw = request.header('authorization') ?? request.header('x-admin-api-key');
    const provided = raw?.startsWith('Bearer ') ? raw.slice('Bearer '.length) : raw;
    if (provided !== expected) {
      throw new UnauthorizedException('Invalid admin API key.');
    }
    return true;
  }
}
