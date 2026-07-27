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
exports.ProviderRegistry = void 0;
const common_1 = require("@nestjs/common");
const arbeitnow_adapter_1 = require("./arbeitnow/arbeitnow.adapter");
const greenhouse_adapter_1 = require("./greenhouse/greenhouse.adapter");
let ProviderRegistry = class ProviderRegistry {
    providers;
    constructor(greenhouse, arbeitnow) {
        this.providers = new Map([
            [greenhouse.type, greenhouse],
            [arbeitnow.type, arbeitnow],
        ]);
    }
    get(type) {
        const provider = this.providers.get(type);
        if (!provider) {
            throw new common_1.NotFoundException(`Job provider is not registered: ${type}`);
        }
        return provider;
    }
    list() {
        return [...this.providers.values()].map((provider) => ({
            name: provider.name,
            type: provider.type,
        }));
    }
};
exports.ProviderRegistry = ProviderRegistry;
exports.ProviderRegistry = ProviderRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [greenhouse_adapter_1.GreenhouseAdapter, arbeitnow_adapter_1.ArbeitnowAdapter])
], ProviderRegistry);
//# sourceMappingURL=provider-registry.js.map