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
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const jobs_repository_1 = require("./jobs.repository");
let JobsService = class JobsService {
    jobs;
    constructor(jobs) {
        this.jobs = jobs;
    }
    list(input) {
        return this.jobs.list(input);
    }
    async findById(id) {
        const job = await this.jobs.findById(id);
        if (!job)
            throw new common_1.NotFoundException('Job not found.');
        return job;
    }
    async findBySlug(slug) {
        const job = await this.jobs.findBySlug(slug);
        if (!job)
            throw new common_1.NotFoundException('Job not found.');
        return job;
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jobs_repository_1.JobsRepository])
], JobsService);
//# sourceMappingURL=jobs.service.js.map