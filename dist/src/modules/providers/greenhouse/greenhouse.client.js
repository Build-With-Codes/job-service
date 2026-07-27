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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreenhouseClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
function describeFetchError(error) {
    if (!(error instanceof Error))
        return String(error);
    const details = [error.message];
    const cause = error.cause;
    if (cause instanceof AggregateError) {
        details.push(`aggregateErrors=${cause.errors
            .map((item) => (item instanceof Error ? item.message : String(item)))
            .join(' | ')}`);
    }
    else if (cause instanceof Error) {
        details.push(`cause=${cause.message}`);
    }
    else if (cause) {
        details.push(`cause=${String(cause)}`);
    }
    return details.join(' ');
}
let GreenhouseClient = class GreenhouseClient {
    config;
    constructor(config) {
        this.config = config;
    }
    async fetchJobs(boardToken) {
        const baseUrl = this.config.get('providers', { infer: true }).greenhouse.baseUrl;
        const url = `${baseUrl.replace(/\/+$/g, '')}/${encodeURIComponent(boardToken)}/jobs?content=true`;
        let response;
        try {
            response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        }
        catch (error) {
            throw new Error(`Greenhouse jobs fetch failed before HTTP response: url=${url} error=${describeFetchError(error)}`);
        }
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Greenhouse jobs request failed: url=${url} status=${response.status} ${response.statusText} body=${body.slice(0, 300)}`);
        }
        return (await response.json());
    }
    async fetchJob(boardToken, sourceJobId) {
        const baseUrl = this.config.get('providers', { infer: true }).greenhouse.baseUrl;
        const url = `${baseUrl.replace(/\/+$/g, '')}/${encodeURIComponent(boardToken)}/jobs/${encodeURIComponent(sourceJobId)}?questions=true`;
        let response;
        try {
            response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        }
        catch (error) {
            throw new Error(`Greenhouse job fetch failed before HTTP response: url=${url} error=${describeFetchError(error)}`);
        }
        if (response.status === 404)
            return null;
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Greenhouse job request failed: url=${url} status=${response.status} ${response.statusText} body=${body.slice(0, 300)}`);
        }
        return (await response.json());
    }
};
exports.GreenhouseClient = GreenhouseClient;
exports.GreenhouseClient = GreenhouseClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GreenhouseClient);
//# sourceMappingURL=greenhouse.client.js.map