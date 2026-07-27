"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersModule = void 0;
const common_1 = require("@nestjs/common");
const arbeitnow_adapter_1 = require("./arbeitnow/arbeitnow.adapter");
const arbeitnow_client_1 = require("./arbeitnow/arbeitnow.client");
const greenhouse_adapter_1 = require("./greenhouse/greenhouse.adapter");
const greenhouse_client_1 = require("./greenhouse/greenhouse.client");
const provider_registry_1 = require("./provider-registry");
let ProvidersModule = class ProvidersModule {
};
exports.ProvidersModule = ProvidersModule;
exports.ProvidersModule = ProvidersModule = __decorate([
    (0, common_1.Module)({
        providers: [greenhouse_client_1.GreenhouseClient, greenhouse_adapter_1.GreenhouseAdapter, arbeitnow_client_1.ArbeitnowClient, arbeitnow_adapter_1.ArbeitnowAdapter, provider_registry_1.ProviderRegistry],
        exports: [provider_registry_1.ProviderRegistry],
    })
], ProvidersModule);
//# sourceMappingURL=providers.module.js.map