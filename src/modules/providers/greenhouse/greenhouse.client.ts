import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env';
import type { GreenhouseJob, GreenhouseJobsResponse } from './greenhouse.types';

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
export class GreenhouseClient {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  async fetchJobs(boardToken: string) {
    const baseUrl = this.config.get('providers', { infer: true }).greenhouse.baseUrl;
    const url = `${baseUrl.replace(/\/+$/g, '')}/${encodeURIComponent(boardToken)}/jobs?content=true`;
    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      throw new Error(
        `Greenhouse jobs fetch failed before HTTP response: url=${url} error=${describeFetchError(error)}`,
      );
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Greenhouse jobs request failed: url=${url} status=${response.status} ${response.statusText} body=${body.slice(0, 300)}`,
      );
    }
    return (await response.json()) as GreenhouseJobsResponse;
  }

  async fetchJob(boardToken: string, sourceJobId: string) {
    const baseUrl = this.config.get('providers', { infer: true }).greenhouse.baseUrl;
    const url = `${baseUrl.replace(/\/+$/g, '')}/${encodeURIComponent(
      boardToken,
    )}/jobs/${encodeURIComponent(sourceJobId)}?questions=true`;
    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      throw new Error(
        `Greenhouse job fetch failed before HTTP response: url=${url} error=${describeFetchError(error)}`,
      );
    }
    if (response.status === 404) return null;
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Greenhouse job request failed: url=${url} status=${response.status} ${response.statusText} body=${body.slice(0, 300)}`,
      );
    }
    return (await response.json()) as GreenhouseJob;
  }
}
