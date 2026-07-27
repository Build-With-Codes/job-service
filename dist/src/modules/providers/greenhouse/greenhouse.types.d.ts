export type GreenhouseLocation = {
    name?: string;
};
export type GreenhouseJob = {
    id: number | string;
    title: string;
    absolute_url?: string;
    internal_job_id?: number | string;
    location?: GreenhouseLocation;
    departments?: Array<{
        name?: string;
    }>;
    offices?: Array<{
        name?: string;
        location?: string;
    }>;
    updated_at?: string;
    first_published?: string;
    content?: string;
    metadata?: Array<{
        name?: string;
        value?: string | string[] | number | boolean | null;
    }>;
};
export type GreenhouseJobsResponse = {
    jobs: GreenhouseJob[];
};
