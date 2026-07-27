"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PromptsScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptsScheduler = void 0;
const common_1 = require("@nestjs/common");
const prompts_service_1 = require("./prompts.service");
let PromptsScheduler = PromptsScheduler_1 = class PromptsScheduler {
    prompts;
    logger = new common_1.Logger(PromptsScheduler_1.name);
    running = false;
    constructor(prompts) {
        this.prompts = prompts;
    }
    async onModuleInit() {
        const intervalMs = Number(process.env.PROMPT_SYNC_INTERVAL_MS ?? 120_000);
        const enabled = process.env.PROMPT_SYNC_ENABLED !== 'false';
        if (!enabled) {
            this.logger.warn('Prompt sync scheduler disabled by PROMPT_SYNC_ENABLED=false.');
            return;
        }
        this.logger.log(`Prompt sync scheduler enabled: every ${intervalMs}ms.`);
        await this.syncOnce('startup');
        setInterval(() => {
            void this.syncOnce('interval');
        }, intervalMs).unref();
    }
    async syncOnce(reason) {
        if (this.running) {
            this.logger.warn(`Prompt sync skipped (${reason}): previous sync is still running.`);
            return;
        }
        this.running = true;
        try {
            const result = await this.prompts.syncFromConfiguredSources();
            this.logger.log(`Prompt sync finished (${reason}): sources=${result.sources} found=${result.promptsFound} saved=${result.promptsSaved}`);
        }
        catch (error) {
            this.logger.error(`Prompt sync failed (${reason}): ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            this.running = false;
        }
    }
};
exports.PromptsScheduler = PromptsScheduler;
exports.PromptsScheduler = PromptsScheduler = PromptsScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prompts_service_1.PromptsService])
], PromptsScheduler);
//# sourceMappingURL=prompts.scheduler.js.map