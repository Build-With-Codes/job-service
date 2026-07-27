import { Injectable, NotFoundException } from '@nestjs/common';
import type { JobProvider } from './provider.interface';
import { ArbeitnowAdapter } from './arbeitnow/arbeitnow.adapter';
import { GreenhouseAdapter } from './greenhouse/greenhouse.adapter';

@Injectable()
export class ProviderRegistry {
  private readonly providers: Map<string, JobProvider>;

  constructor(greenhouse: GreenhouseAdapter, arbeitnow: ArbeitnowAdapter) {
    this.providers = new Map<string, JobProvider>([
      [greenhouse.type, greenhouse],
      [arbeitnow.type, arbeitnow],
    ]);
  }

  get(type: string) {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new NotFoundException(`Job provider is not registered: ${type}`);
    }
    return provider;
  }

  list() {
    return [...this.providers.values()].map((provider) => ({
      name: provider.name,
      type: provider.type,
    }));
  }
}
