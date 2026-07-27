export type ProviderSyncJob = {
  providerType: string;
  requestedBy: 'scheduler' | 'admin';
};

export type JobExpirationJob = {
  requestedBy: 'scheduler' | 'admin';
};

export type OutboxProcessingJob = {
  requestedBy: 'scheduler' | 'worker' | 'admin';
};

export type JobIndexingJob = {
  jobId: string;
  eventId?: string;
};
