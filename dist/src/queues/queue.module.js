"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const queue_constants_1 = require("./queue.constants");
function redisConnectionFromUrl(raw) {
    const url = new URL(raw);
    const isTls = url.protocol === 'rediss:';
    return {
        host: url.hostname,
        port: Number(url.port || 6379),
        username: url.username ? decodeURIComponent(url.username) : undefined,
        password: url.password ? decodeURIComponent(url.password) : undefined,
        db: url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : 0,
        tls: isTls ? {} : undefined,
        maxRetriesPerRequest: null,
        connectTimeout: 5_000,
    };
}
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const redisUrl = config.get('redisUrl', { infer: true });
                    const connection = redisConnectionFromUrl(redisUrl);
                    new common_1.Logger(QueueModule.name).log(`Configuring BullMQ Redis connection: host=${connection.host} port=${connection.port} db=${connection.db}`);
                    return {
                        connection,
                        defaultJobOptions: {
                            attempts: 3,
                            backoff: {
                                type: 'exponential',
                                delay: 5_000,
                            },
                            removeOnComplete: 500,
                            removeOnFail: 1_000,
                        },
                    };
                },
            }),
            bullmq_1.BullModule.registerQueue(...queue_constants_1.QUEUE_NAMES.map((name) => ({ name }))),
        ],
        exports: [bullmq_1.BullModule],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map