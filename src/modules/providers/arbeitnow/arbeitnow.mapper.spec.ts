import { mapArbeitnowJob } from './arbeitnow.mapper';

describe('mapArbeitnowJob', () => {
  it('normalizes public Arbeitnow jobs', () => {
    const mapped = mapArbeitnowJob({
      slug: 'machine-learning-engineer-example',
      company_name: 'Example AI',
      title: 'Machine Learning Engineer',
      description: '<p>Build LLM and RAG products.</p>',
      remote: true,
      url: 'https://www.arbeitnow.com/jobs/machine-learning-engineer-example',
      tags: ['Python', 'AI'],
      job_types: ['Full Time'],
      location: 'Germany',
      created_at: 1785000000,
    });

    expect(mapped.provider).toBe('arbeitnow');
    expect(mapped.sourceJobId).toBe('machine-learning-engineer-example');
    expect(mapped.companyName).toBe('Example AI');
    expect(mapped.locations[0].isRemote).toBe(true);
    expect(mapped.descriptionText).toBe('Build LLM and RAG products.');
    expect(mapped.employmentType).toBe('FULL_TIME');
    expect(mapped.skills).toEqual(['Python', 'AI']);
  });

  it('cleans html entities from descriptions before saving searchable text', () => {
    const mapped = mapArbeitnowJob({
      slug: 'frontend-engineer-example',
      company_name: 'Example AI',
      title: 'Frontend Engineer',
      description: '<p>Build R&amp;D tools&nbsp;for AI teams.</p>',
      remote: false,
      url: 'https://www.arbeitnow.com/jobs/frontend-engineer-example',
      tags: ['React', 'React', 'TypeScript'],
      job_types: ['Part Time'],
      location: 'Berlin, Germany',
      created_at: '1785000000',
    });

    expect(mapped.descriptionText).toBe('Build R&D tools for AI teams.');
    expect(mapped.employmentType).toBe('PART_TIME');
    expect(mapped.skills).toEqual(['React', 'TypeScript']);
    expect(mapped.locations[0]).toMatchObject({
      city: 'Berlin',
      country: 'Germany',
      isRemote: false,
    });
  });
});
