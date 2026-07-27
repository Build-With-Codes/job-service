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
exports.AdminGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let AdminGuard = class AdminGuard {
    config;
    constructor(config) {
        this.config = config;
    }
    canActivate(context) {
        const expected = this.config.get('adminApiKey', { infer: true });
        if (!expected) {
            throw new common_1.UnauthorizedException('Admin API key is not configured.');
        }
        const request = context.switchToHttp().getRequest();
        const raw = request.header('authorization') ?? request.header('x-admin-api-key');
        const provided = raw?.startsWith('Bearer ') ? raw.slice('Bearer '.length) : raw;
        if (provided !== expected) {
            throw new common_1.UnauthorizedException('Invalid admin API key.');
        }
        return true;
    }
};
exports.AdminGuard = AdminGuard;
exports.AdminGuard = AdminGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AdminGuard);
//# sourceMappingURL=admin.guard.js.map