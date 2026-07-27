export declare const PROVIDER_SYNC_QUEUE = "provider-sync";
export declare const JOB_NORMALIZATION_QUEUE = "job-normalization";
export declare const JOB_INDEXING_QUEUE = "job-indexing";
export declare const JOB_EXPIRATION_QUEUE = "job-expiration";
export declare const OUTBOX_PROCESSING_QUEUE = "outbox-processing";
export declare const AI_PROCESSING_QUEUE = "ai-processing";
export declare const QUEUE_NAMES: readonly ["provider-sync", "job-normalization", "job-indexing", "job-expiration", "outbox-processing", "ai-processing"];
export type QueueName = (typeof QUEUE_NAMES)[number];
