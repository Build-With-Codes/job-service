import { OnModuleInit } from '@nestjs/common';
import { PromptsService } from './prompts.service';
export declare class PromptsScheduler implements OnModuleInit {
    private readonly prompts;
    private readonly logger;
    private running;
    constructor(prompts: PromptsService);
    onModuleInit(): Promise<void>;
    private resolveIntervalMs;
    private syncOnce;
}
