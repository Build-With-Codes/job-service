"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const worker_module_1 = require("./worker.module");
function isRedisRequestLimitError(error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('ERR max requests limit exceeded');
}
function stopWorkerForRedisQuota(error) {
    if (!isRedisRequestLimitError(error)) {
        return false;
    }
    common_1.Logger.error('Redis request quota exhausted. Stopping worker to avoid burning additional Upstash requests. Set QUEUE_WORKERS_ENABLED=false until quota resets or Redis is upgraded.');
    process.exit(0);
}
process.on('uncaughtException', (error) => {
    if (stopWorkerForRedisQuota(error))
        return;
    common_1.Logger.error(`Uncaught worker exception: ${error.message}`);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    if (stopWorkerForRedisQuota(reason))
        return;
    common_1.Logger.error(`Unhandled worker rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
    process.exit(1);
});
async function bootstrap() {
    common_1.Logger.log('Bootstrapping Job Service worker...');
    await core_1.NestFactory.createApplicationContext(worker_module_1.WorkerModule, { bufferLogs: false });
    common_1.Logger.log('Job Service worker started.');
}
bootstrap().catch((error) => {
    common_1.Logger.error(`Job Service worker failed to start: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
//# sourceMappingURL=worker.js.map