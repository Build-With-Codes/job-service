import { FingerprintService } from './fingerprint.service';

describe('FingerprintService', () => {
  const service = new FingerprintService();

  it('creates stable fingerprints across spacing and case differences', () => {
    const first = service.create({
      provider: 'test',
      sourceJobId: '1',
      title: 'Senior TypeScript Engineer',
      companyName: 'AiverseWorld',
      employmentType: 'Full Time',
      locations: [{ city: 'Bengaluru', countryCode: 'IN', isRemote: true }],
      sourceUrl: 'https://example.com/1',
      applyUrl: 'https://example.com/1',
    });
    const second = service.create({
      provider: 'test',
      sourceJobId: '2',
      title: ' senior   typescript engineer ',
      companyName: 'aiverseworld',
      employmentType: 'full-time',
      locations: [{ city: ' bengaluru ', countryCode: 'in', isRemote: true }],
      sourceUrl: 'https://example.com/2',
      applyUrl: 'https://example.com/2',
    });

    expect(first).toBe(second);
  });
});
