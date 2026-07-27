import { Injectable } from '@nestjs/common';
import { sha256 } from '../../common/utils/hash';
import type { NormalizedJobInput } from '../normalization/normalization.types';

function normalize(value: string | undefined) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

@Injectable()
export class FingerprintService {
  create(input: NormalizedJobInput) {
    const location = input.locations
      .map((item) => [item.city, item.state, item.countryCode, item.isRemote ? 'remote' : 'onsite'].map(normalize).join(':'))
      .sort()
      .join('|');
    return sha256(
      [
        normalize(input.companyName),
        normalize(input.title),
        location,
        normalize(input.employmentType),
      ].join('|'),
    );
  }

  contentHash(input: NormalizedJobInput) {
    return sha256([input.title, input.descriptionText, input.applyUrl].join('|'));
  }
}
