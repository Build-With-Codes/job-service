import { canonicalizeUrl, isValidUrl } from './url';

describe('url utilities', () => {
  it('removes common tracking parameters and fragments', () => {
    expect(
      canonicalizeUrl('https://example.com/jobs/123/?utm_source=x&gclid=y#apply'),
    ).toBe('https://example.com/jobs/123');
  });

  it('rejects invalid urls', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('https://example.com')).toBe(true);
  });
});
