"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapGreenhouseJob = mapGreenhouseJob;
const url_1 = require("../../../common/utils/url");
const WORK_MODE_ONLY_PATTERN = /^(remote|hybrid|on-?site|in-?office)$/i;
const JOB_POSTING_LOCATION = 'Job Posting Location';
function htmlToText(html) {
    return (html ?? '')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function metadataValueToString(value) {
    if (Array.isArray(value))
        return value.map(String).join(', ');
    if (value === null || value === undefined)
        return undefined;
    const text = String(value).trim();
    return text || undefined;
}
function extractPostingLocation(job) {
    const metadataItem = job.metadata?.find((item) => item.name?.trim().toLowerCase() === JOB_POSTING_LOCATION.toLowerCase());
    return metadataValueToString(metadataItem?.value);
}
function resolveLocationText(job) {
    const primary = job.location?.name?.trim() ?? job.offices?.[0]?.location?.trim() ?? job.offices?.[0]?.name?.trim();
    const fromMetadata = extractPostingLocation(job);
    if (fromMetadata && (!primary || WORK_MODE_ONLY_PATTERN.test(primary))) {
        return fromMetadata;
    }
    return primary || fromMetadata || 'Unknown';
}
function parseLocation(raw) {
    const text = (raw ?? '').trim();
    const isRemote = /\b(remote|anywhere|work from home)\b/i.test(text);
    const parts = text
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    return {
        city: isRemote ? undefined : parts[0],
        state: isRemote ? undefined : parts[1],
        country: isRemote ? undefined : parts[2],
        isRemote,
    };
}
function mapGreenhouseJob(job, boardToken, companyName = boardToken) {
    const sourceUrl = job.absolute_url && (0, url_1.isValidUrl)(job.absolute_url)
        ? job.absolute_url
        : `https://boards.greenhouse.io/${boardToken}/jobs/${job.id}`;
    const locationText = resolveLocationText(job);
    return {
        provider: 'greenhouse',
        sourceJobId: String(job.id),
        title: job.title,
        companyName,
        description: job.content,
        descriptionText: htmlToText(job.content),
        locations: [parseLocation(locationText)],
        postedAt: job.first_published
            ? new Date(job.first_published)
            : job.updated_at
                ? new Date(job.updated_at)
                : undefined,
        sourceUrl,
        applyUrl: sourceUrl,
        skills: job.departments?.map((department) => department.name).filter((name) => Boolean(name)),
        rawPayload: job,
    };
}
//# sourceMappingURL=greenhouse.mapper.js.map