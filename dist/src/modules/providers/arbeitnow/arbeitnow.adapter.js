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
exports.ArbeitnowAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const arbeitnow_client_1 = require("./arbeitnow.client");
const arbeitnow_mapper_1 = require("./arbeitnow.mapper");
let ArbeitnowAdapter = class ArbeitnowAdapter {
    client;
    config;
    name = 'Arbeitnow';
    type = 'arbeitnow';
    constructor(client, config) {
        this.client = client;
        this.config = config;
    }
    async fetchJobs(options) {
        const configuredPages = this.config.get('providers', { infer: true }).arbeitnow.pages;
        const pages = Math.min(Math.max(1, options.limit ?? configuredPages), 10);
        const jobs = [];
        for (let page = 1; page <= pages; page += 1) {
            const response = await this.client.fetchJobs(page);
            jobs.push(...(response.data ?? []).map(arbeitnow_mapper_1.mapArbeitnowJob));
            if (!response.links?.next)
                break;
        }
        return {
            jobs,
            fetchedAt: new Date(),
        };
    }
    async fetchJob(sourceJobId) {
        const response = await this.client.fetchJobs(1);
        return response.data?.find((job) => job.slug === sourceJobId || job.url === sourceJobId) ?? null;
    }
};
exports.ArbeitnowAdapter = ArbeitnowAdapter;
exports.ArbeitnowAdapter = ArbeitnowAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [arbeitnow_client_1.ArbeitnowClient,
        config_1.ConfigService])
], ArbeitnowAdapter);
//# sourceMappingURL=arbeitnow.adapter.js.map