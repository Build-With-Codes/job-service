import { getAiJobRelevance } from './ai-job-filter';

describe('getAiJobRelevance', () => {
  it('accepts AI and machine learning roles', () => {
    expect(
      getAiJobRelevance({
        provider: 'test',
        sourceJobId: '1',
        title: 'Senior Machine Learning Engineer',
        companyName: 'AiverseWorld',
        descriptionText: 'Build model training and inference systems with Python.',
        locations: [{ isRemote: true }],
        sourceUrl: 'https://example.com/jobs/1',
        applyUrl: 'https://example.com/jobs/1',
      }).isAiRelated,
    ).toBe(true);
  });

  it('accepts future-technology roles beyond AI', () => {
    expect(
      getAiJobRelevance({
        provider: 'test',
        sourceJobId: '3',
        title: 'Cloud Security Engineer',
        companyName: 'AiverseWorld',
        descriptionText: 'Build AWS, Kubernetes, and DevSecOps controls for platform teams.',
        locations: [{ isRemote: true }],
        sourceUrl: 'https://example.com/jobs/3',
        applyUrl: 'https://example.com/jobs/3',
      }).isAiRelated,
    ).toBe(true);

    expect(
      getAiJobRelevance({
        provider: 'test',
        sourceJobId: '4',
        title: 'Product Designer',
        companyName: 'AiverseWorld',
        descriptionText: 'Design developer tools, AI workflows, UX systems, and SaaS product experiences.',
        locations: [{ isRemote: true }],
        sourceUrl: 'https://example.com/jobs/4',
        applyUrl: 'https://example.com/jobs/4',
      }).isAiRelated,
    ).toBe(true);
  });

  it('rejects unrelated business roles', () => {
    expect(
      getAiJobRelevance({
        provider: 'test',
        sourceJobId: '2',
        title: 'Payroll Operations Specialist',
        companyName: 'AiverseWorld',
        descriptionText: 'Manage payroll processes and vendor documentation.',
        locations: [{ isRemote: false }],
        sourceUrl: 'https://example.com/jobs/2',
        applyUrl: 'https://example.com/jobs/2',
      }).isAiRelated,
    ).toBe(false);
  });
});
