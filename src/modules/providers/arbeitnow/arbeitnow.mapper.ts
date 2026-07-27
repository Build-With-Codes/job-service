import { isValidUrl } from '../../../common/utils/url';
import type { NormalizedJobInput, NormalizedLocation } from '../../normalization/normalization.types';
import type { ArbeitnowJob } from './arbeitnow.types';

function htmlToText(html: string | undefined) {
  return (html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeEmploymentType(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase().replace(/[-\s]+/g, '_');
  const known: Record<string, string> = {
    full_time: 'FULL_TIME',
    fulltime: 'FULL_TIME',
    part_time: 'PART_TIME',
    parttime: 'PART_TIME',
    contract: 'CONTRACT',
    contractor: 'CONTRACT',
    freelance: 'FREELANCE',
    internship: 'INTERNSHIP',
    intern: 'INTERNSHIP',
    temporary: 'TEMPORARY',
  };
  return known[normalized] ?? normalized.toUpperCase();
}

function normalizeSkillTags(tags: string[] | undefined) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function parseLocation(raw: string | undefined, remote: boolean | undefined): NormalizedLocation {
  const text = (raw ?? '').trim();
  const isRemote = Boolean(remote) || /\b(remote|anywhere|work from home)\b/i.test(text);
  const parts = text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    city: isRemote ? undefined : parts[0],
    state: isRemote ? undefined : parts.length > 2 ? parts[1] : undefined,
    country: isRemote ? parts[0] : parts.length > 1 ? parts[parts.length - 1] : undefined,
    isRemote,
  };
}

function parseCreatedAt(value: number | string | undefined) {
  if (!value) return undefined;
  if (typeof value === 'number') return new Date(value * 1000);
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return new Date(parsed * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function mapArbeitnowJob(job: ArbeitnowJob): NormalizedJobInput {
  const sourceUrl = job.url && isValidUrl(job.url) ? job.url : `https://www.arbeitnow.com/jobs/${job.slug ?? ''}`;
  const sourceJobId = job.slug || sourceUrl;
  const employmentType = normalizeEmploymentType(job.job_types?.[0]);
  const skills = normalizeSkillTags(job.tags);

  return {
    provider: 'arbeitnow',
    sourceJobId,
    title: job.title ?? '',
    companyName: job.company_name ?? 'Unknown Company',
    description: job.description,
    descriptionText: htmlToText(job.description),
    locations: [parseLocation(job.location, job.remote)],
    employmentType,
    workplaceType: job.remote ? 'REMOTE' : undefined,
    postedAt: parseCreatedAt(job.created_at),
    sourceUrl,
    applyUrl: sourceUrl,
    skills,
    rawPayload: job,
  };
}
