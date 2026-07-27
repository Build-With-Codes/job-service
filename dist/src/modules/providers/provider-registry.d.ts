import type { JobProvider } from './provider.interface';
import { ArbeitnowAdapter } from './arbeitnow/arbeitnow.adapter';
import { GreenhouseAdapter } from './greenhouse/greenhouse.adapter';
export declare class ProviderRegistry {
    private readonly providers;
    constructor(greenhouse: GreenhouseAdapter, arbeitnow: ArbeitnowAdapter);
    get(type: string): JobProvider;
    list(): {
        name: string;
        type: string;
    }[];
}
