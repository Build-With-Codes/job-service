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
exports.GreenhouseAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const greenhouse_client_1 = require("./greenhouse.client");
const greenhouse_mapper_1 = require("./greenhouse.mapper");
let GreenhouseAdapter = class GreenhouseAdapter {
    client;
    config;
    name = 'Greenhouse';
    type = 'greenhouse';
    constructor(client, config) {
        this.client = client;
        this.config = config;
    }
    async fetchJobs(_options) {
        const boardToken = this.config.get('providers', { infer: true }).greenhouse.boardToken;
        if (!boardToken) {
            throw new Error('GREENHOUSE_BOARD_TOKEN is required to run the Greenhouse provider.');
        }
        const companyName = this.config.get('providers', { infer: true }).greenhouse.companyName ?? boardToken;
        const payload = await this.client.fetchJobs(boardToken);
        return {
            jobs: payload.jobs.map((job) => (0, greenhouse_mapper_1.mapGreenhouseJob)(job, boardToken, companyName)),
            fetchedAt: new Date(),
        };
    }
    async fetchJob(sourceJobId) {
        const boardToken = this.config.get('providers', { infer: true }).greenhouse.boardToken;
        if (!boardToken) {
            throw new Error('GREENHOUSE_BOARD_TOKEN is required to run the Greenhouse provider.');
        }
        return this.client.fetchJob(boardToken, sourceJobId);
    }
};
exports.GreenhouseAdapter = GreenhouseAdapter;
exports.GreenhouseAdapter = GreenhouseAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [greenhouse_client_1.GreenhouseClient,
        config_1.ConfigService])
], GreenhouseAdapter);
//# sourceMappingURL=greenhouse.adapter.js.map