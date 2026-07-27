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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prompts_dto_1 = require("./prompts.dto");
const prompts_service_1 = require("./prompts.service");
function assertInternal(headers) {
    const configuredKey = process.env.INTERNAL_API_KEY?.trim();
    if (!configuredKey) {
        if (process.env.NODE_ENV === 'production') {
            throw new common_1.UnauthorizedException('INTERNAL_API_KEY is not configured.');
        }
        return;
    }
    const rawKey = headers['x-internal-api-key'];
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    if (key !== configuredKey) {
        throw new common_1.UnauthorizedException('Invalid internal API key.');
    }
}
function requireUserId(userId) {
    const trimmed = userId?.trim();
    if (!trimmed)
        throw new common_1.BadRequestException('userId is required.');
    return trimmed;
}
let PromptsController = class PromptsController {
    prompts;
    constructor(prompts) {
        this.prompts = prompts;
    }
    search(query) {
        return this.prompts.search(query);
    }
    stats() {
        return this.prompts.stats();
    }
    async saved(headers, userId) {
        assertInternal(headers);
        return { data: await this.prompts.getSaved(requireUserId(userId)) };
    }
    async save(headers, body) {
        assertInternal(headers);
        if (!body?.promptId?.trim())
            throw new common_1.BadRequestException('promptId is required.');
        return { data: await this.prompts.savePrompt(requireUserId(body.userId), body.promptId.trim()) };
    }
    async unsave(headers, userId, promptId) {
        assertInternal(headers);
        if (!promptId?.trim())
            throw new common_1.BadRequestException('promptId is required.');
        return { data: await this.prompts.unsavePrompt(requireUserId(userId), promptId.trim()) };
    }
    sync() {
        return this.prompts.syncFromConfiguredSources();
    }
    reprocess(limit) {
        return this.prompts.reprocessExistingPrompts(limit ? Number(limit) : 25);
    }
    async recordEvent(slug, body) {
        if (body?.type !== 'copy' && body?.type !== 'view' && body?.type !== 'share') {
            throw new common_1.BadRequestException('Supported prompt event types: copy, view, share.');
        }
        return {
            data: await this.prompts.recordEvent(slug, body.type, {
                visitorKey: body.visitorKey,
                idempotencyKey: body.idempotencyKey,
            }),
        };
    }
    findBySlug(slug) {
        return this.prompts.findBySlug(slug);
    }
};
exports.PromptsController = PromptsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [prompts_dto_1.SearchPromptsDto]),
    __metadata("design:returntype", void 0)
], PromptsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PromptsController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('me/saved'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PromptsController.prototype, "saved", null);
__decorate([
    (0, common_1.Post)('me/saved'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PromptsController.prototype, "save", null);
__decorate([
    (0, common_1.Delete)('me/saved'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('promptId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PromptsController.prototype, "unsave", null);
__decorate([
    (0, common_1.Post)('sync'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PromptsController.prototype, "sync", null);
__decorate([
    (0, common_1.Post)('reprocess'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PromptsController.prototype, "reprocess", null);
__decorate([
    (0, common_1.Post)(':slug/events'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PromptsController.prototype, "recordEvent", null);
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PromptsController.prototype, "findBySlug", null);
exports.PromptsController = PromptsController = __decorate([
    (0, swagger_1.ApiTags)('prompts'),
    (0, common_1.Controller)('prompts'),
    __metadata("design:paramtypes", [prompts_service_1.PromptsService])
], PromptsController);
//# sourceMappingURL=prompts.controller.js.map