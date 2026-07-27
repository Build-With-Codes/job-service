import { BadRequestException } from '@nestjs/common';
import { NormalizationService } from './normalization.service';

describe('NormalizationService', () => {
  const service = new NormalizationService();

  it('normalizes whitespace and uppercases common enums', () => {
    const job = service.normalize({
      provider: 'test',
      sourceJobId: 'job-1',
      title: '  Senior   TypeScript Engineer ',
      companyName: ' AiverseWorld ',
      employmentType: 'full-time',
      workplaceType: 'remote',
      locations: [{ city: ' Bengaluru ', countryCode: 'in', isRemote: true }],
      sourceUrl: 'https://example.com/jobs/1',
      applyUrl: 'https://example.com/jobs/1/apply',
    });

    expect(job.title).toBe('Senior TypeScript Engineer');
    expect(job.companyName).toBe('AiverseWorld');
    expect(job.employmentType).toBe('FULL-TIME');
    expect(job.locations[0].countryCode).toBe('IN');
  });

  it('rejects invalid jobs before persistence', () => {
    expect(() =>
      service.normalize({
        provider: 'test',
        sourceJobId: '',
        title: '',
        companyName: 'AiverseWorld',
        locations: [],
        sourceUrl: 'bad',
        applyUrl: 'bad',
      }),
    ).toThrow(BadRequestException);
  });
});
