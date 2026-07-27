export const PROVIDER_SYNC_QUEUE = 'provider-sync';
export const JOB_NORMALIZATION_QUEUE = 'job-normalization';
export const JOB_INDEXING_QUEUE = 'job-indexing';
export const JOB_EXPIRATION_QUEUE = 'job-expiration';
export const OUTBOX_PROCESSING_QUEUE = 'outbox-processing';
export const AI_PROCESSING_QUEUE = 'ai-processing';

export const QUEUE_NAMES = [
  PROVIDER_SYNC_QUEUE,
  JOB_NORMALIZATION_QUEUE,
  JOB_INDEXING_QUEUE,
  JOB_EXPIRATION_QUEUE,
  OUTBOX_PROCESSING_QUEUE,
  AI_PROCESSING_QUEUE,
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];
