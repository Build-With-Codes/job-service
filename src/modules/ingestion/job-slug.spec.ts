import { buildJobSlug } from './ingestion.service';

describe('buildJobSlug', () => {
  it('keeps same-title jobs unique by provider and source id', () => {
    const baseJob = {
      provider: 'greenhouse',
      title: 'Machine Learning Engineer',
      companyName: 'Stripe',
      locations: [{ isRemote: true }],
      sourceUrl: 'https://example.com/jobs/1',
      applyUrl: 'https://example.com/jobs/1',
    };

    expect(buildJobSlug({ ...baseJob, sourceJobId: '100' })).toBe(
      'stripe-machine-learning-engineer-greenhouse-100',
    );
    expect(buildJobSlug({ ...baseJob, sourceJobId: '200' })).toBe(
      'stripe-machine-learning-engineer-greenhouse-200',
    );
  });
});
