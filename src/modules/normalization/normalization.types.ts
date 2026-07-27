export type NormalizedLocation = {
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  isRemote: boolean;
};

export type NormalizedJobInput = {
  provider: string;
  sourceJobId: string;
  title: string;
  companyName: string;
  companyDomain?: string;
  description?: string;
  descriptionText?: string;
  locations: NormalizedLocation[];
  employmentType?: string;
  workplaceType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  postedAt?: Date;
  sourceUrl: string;
  applyUrl: string;
  skills?: string[];
  rawPayload?: unknown;
};
