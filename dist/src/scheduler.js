"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const scheduler_module_1 = require("./scheduler.module");
async function bootstrap() {
    common_1.Logger.log('Bootstrapping Job Service scheduler...');
    await core_1.NestFactory.createApplicationContext(scheduler_module_1.SchedulerModule, { bufferLogs: false });
    common_1.Logger.log('Job Service scheduler started.');
}
bootstrap().catch((error) => {
    common_1.Logger.error(`Job Service scheduler failed to start: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
//# sourceMappingURL=scheduler.js.map