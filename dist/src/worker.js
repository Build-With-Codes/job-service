"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const worker_module_1 = require("./worker.module");
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