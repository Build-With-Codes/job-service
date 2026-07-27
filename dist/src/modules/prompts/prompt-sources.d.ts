export type PromptSourceType = 'json-feed' | 'csv-feed' | 'html' | 'github-repo' | 'github-search';
export type PromptSourceConfig = {
    name: string;
    url: string;
    type: PromptSourceType;
    priority: number;
    fetchUrl?: string;
};
export declare const DEFAULT_PROMPT_SOURCES: PromptSourceConfig[];
