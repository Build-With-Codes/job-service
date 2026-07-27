import { BadRequestException, Injectable } from '@nestjs/common';
import type { NormalizedJobInput, NormalizedLocation } from './normalization.types';
import { isValidUrl } from '../../common/utils/url';

function clean(value: string | undefined) {
  return value?.replace(/\s+/g, ' ').trim();
}

function normalizeLocation(location: NormalizedLocation): NormalizedLocation {
  return {
    city: clean(location.city),
    state: clean(location.state),
    country: clean(location.country),
    countryCode: clean(location.countryCode)?.toUpperCase(),
    latitude: location.latitude,
    longitude: location.longitude,
    isRemote: Boolean(location.isRemote),
  };
}

@Injectable()
export class NormalizationService {
  normalize(input: NormalizedJobInput): NormalizedJobInput {
    const normalized: NormalizedJobInput = {
      ...input,
      title: clean(input.title) ?? '',
      companyName: clean(input.companyName) ?? '',
      companyDomain: clean(input.companyDomain)?.toLowerCase(),
      description: input.description?.trim(),
      descriptionText: clean(input.descriptionText),
      employmentType: clean(input.employmentType)?.toUpperCase(),
      workplaceType: clean(input.workplaceType)?.toUpperCase(),
      salaryCurrency: clean(input.salaryCurrency)?.toUpperCase(),
      salaryPeriod: clean(input.salaryPeriod)?.toUpperCase(),
      sourceUrl: input.sourceUrl.trim(),
      applyUrl: input.applyUrl.trim(),
      locations: input.locations.length > 0 ? input.locations.map(normalizeLocation) : [{ isRemote: false }],
      skills: input.skills?.map((skill) => clean(skill)).filter((skill): skill is string => Boolean(skill)),
    };
    this.validate(normalized);
    return normalized;
  }

  validate(input: NormalizedJobInput) {
    if (!input.title) throw new BadRequestException('Job title is required.');
    if (!input.companyName) throw new BadRequestException('Company is required.');
    if (!input.sourceJobId) throw new BadRequestException('Source job id is required.');
    if (!isValidUrl(input.sourceUrl)) throw new BadRequestException('Source URL is invalid.');
    if (!isValidUrl(input.applyUrl)) throw new BadRequestException('Apply URL is invalid.');
  }
}
