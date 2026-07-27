"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalizationService = void 0;
const common_1 = require("@nestjs/common");
const url_1 = require("../../common/utils/url");
function clean(value) {
    return value?.replace(/\s+/g, ' ').trim();
}
function normalizeLocation(location) {
    return {
        city: clean(location.city),
        state: clean(location.state),
        country: clean(location.country),
        countryCode: clean(location.countryCode)?.toUpperCase(),
        latitude: location.latitude,
        longitude: location.longitude,
        isRemote: Boolean(location.isRemote),
    };
}
let NormalizationService = class NormalizationService {
    normalize(input) {
        const normalized = {
            ...input,
            title: clean(input.title) ?? '',
            companyName: clean(input.companyName) ?? '',
            companyDomain: clean(input.companyDomain)?.toLowerCase(),
            description: input.description?.trim(),
            descriptionText: clean(input.descriptionText),
            employmentType: clean(input.employmentType)?.toUpperCase(),
            workplaceType: clean(input.workplaceType)?.toUpperCase(),
            salaryCurrency: clean(input.salaryCurrency)?.toUpperCase(),
            salaryPeriod: clean(input.salaryPeriod)?.toUpperCase(),
            sourceUrl: input.sourceUrl.trim(),
            applyUrl: input.applyUrl.trim(),
            locations: input.locations.length > 0 ? input.locations.map(normalizeLocation) : [{ isRemote: false }],
            skills: input.skills?.map((skill) => clean(skill)).filter((skill) => Boolean(skill)),
        };
        this.validate(normalized);
        return normalized;
    }
    validate(input) {
        if (!input.title)
            throw new common_1.BadRequestException('Job title is required.');
        if (!input.companyName)
            throw new common_1.BadRequestException('Company is required.');
        if (!input.sourceJobId)
            throw new common_1.BadRequestException('Source job id is required.');
        if (!(0, url_1.isValidUrl)(input.sourceUrl))
            throw new common_1.BadRequestException('Source URL is invalid.');
        if (!(0, url_1.isValidUrl)(input.applyUrl))
            throw new common_1.BadRequestException('Apply URL is invalid.');
    }
};
exports.NormalizationService = NormalizationService;
exports.NormalizationService = NormalizationService = __decorate([
    (0, common_1.Injectable)()
], NormalizationService);
//# sourceMappingURL=normalization.service.js.map