"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FingerprintService = void 0;
const common_1 = require("@nestjs/common");
const hash_1 = require("../../common/utils/hash");
function normalize(value) {
    return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}
let FingerprintService = class FingerprintService {
    create(input) {
        const location = input.locations
            .map((item) => [item.city, item.state, item.countryCode, item.isRemote ? 'remote' : 'onsite'].map(normalize).join(':'))
            .sort()
            .join('|');
        return (0, hash_1.sha256)([
            normalize(input.companyName),
            normalize(input.title),
            location,
            normalize(input.employmentType),
        ].join('|'));
    }
    contentHash(input) {
        return (0, hash_1.sha256)([input.title, input.descriptionText, input.applyUrl].join('|'));
    }
};
exports.FingerprintService = FingerprintService;
exports.FingerprintService = FingerprintService = __decorate([
    (0, common_1.Injectable)()
], FingerprintService);
//# sourceMappingURL=fingerprint.service.js.map