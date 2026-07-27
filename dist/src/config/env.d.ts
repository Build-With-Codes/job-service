export type AppRuntime = 'api' | 'worker' | 'scheduler';
export declare const env: () => {
    nodeEnv: string;
    port: number;
    databaseUrl: string;
    directUrl: string | undefined;
    redisUrl: string;
    adminApiKey: string | undefined;
    corsOrigins: string[];
    logLevel: string;
    dbPoolMax: number;
    providerSyncCron: string;
    jobExpirationCron: string;
    outboxCron: string;
    aiJobFilterEnabled: boolean;
    providers: {
        greenhouse: {
            boardToken: string | undefined;
            companyName: string | undefined;
            baseUrl: string;
        };
        arbeitnow: {
            baseUrl: string;
            pages: number;
        };
        lever: {
            baseUrl: string;
        };
        ashby: {
            baseUrl: string;
        };
    };
};
export type EnvConfig = ReturnType<typeof env>;
