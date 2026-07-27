import { Module } from '@nestjs/common';
import { ArbeitnowAdapter } from './arbeitnow/arbeitnow.adapter';
import { ArbeitnowClient } from './arbeitnow/arbeitnow.client';
import { GreenhouseAdapter } from './greenhouse/greenhouse.adapter';
import { GreenhouseClient } from './greenhouse/greenhouse.client';
import { ProviderRegistry } from './provider-registry';

@Module({
  providers: [GreenhouseClient, GreenhouseAdapter, ArbeitnowClient, ArbeitnowAdapter, ProviderRegistry],
  exports: [ProviderRegistry],
})
export class ProvidersModule {}
