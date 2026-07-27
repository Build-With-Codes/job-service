import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env';
import type { ArbeitnowJobsResponse } from './arbeitnow.types';

function describeFetchError(error: unknown) {
  if (!(error instanceof Error)) return String(error);
  const details = [error.message];
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof AggregateError) {
    details.push(
      `aggregateErrors=${cause.errors
        .map((item) => (item instanceof Error ? item.message : String(item)))
        .join(' | ')}`,
    );
  } else if (cause instanceof Error) {
    details.push(`cause=${cause.message}`);
  } else if (cause) {
    details.push(`cause=${String(cause)}`);
  }
  return details.join(' ');
}

@Injectable()
export class ArbeitnowClient {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  async fetchJobs(page: number) {
    const baseUrl = this.config.get('providers', { infer: true }).arbeitnow.baseUrl;
    const url = new URL(baseUrl);
    url.searchParams.set('page', String(page));

    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      throw new Error(
        `Arbeitnow jobs fetch failed before HTTP response: url=${url.toString()} error=${describeFetchError(error)}`,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Arbeitnow jobs request failed: url=${url.toString()} status=${response.status} ${response.statusText} body=${body.slice(0, 300)}`,
      );
    }

    return (await response.json()) as ArbeitnowJobsResponse;
  }
}
