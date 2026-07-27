"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const node_net_1 = require("node:net");
const app_module_1 = require("./app.module");
const bootstrapLogger = new common_1.Logger('Bootstrap');
async function findAvailablePort(preferredPort) {
    if (process.env.RENDER === 'true' || process.env.NODE_ENV === 'production') {
        return preferredPort;
    }
    const fallbackEnabled = process.env.PORT_FALLBACK !== 'false' &&
        process.env.NODE_ENV !== 'production' &&
        process.env.RENDER !== 'true';
    const maxAttempts = fallbackEnabled ? 10 : 1;
    for (let offset = 0; offset < maxAttempts; offset += 1) {
        const candidatePort = preferredPort + offset;
        const available = await new Promise((resolve) => {
            const server = (0, node_net_1.createServer)();
            server.once('error', () => {
                resolve(false);
            });
            server.once('listening', () => {
                server.close(() => resolve(true));
            });
            server.listen(candidatePort, '0.0.0.0');
        });
        if (available) {
            return candidatePort;
        }
    }
    throw new Error(`No available port found starting from ${preferredPort}. Set PORT to a free port or stop the process using it.`);
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    const config = app.get((config_1.ConfigService));
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.enableCors({
        origin: config.get('corsOrigins', { infer: true }),
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: true,
    }));
    const document = swagger_1.SwaggerModule.createDocument(app, new swagger_1.DocumentBuilder()
        .setTitle('AiverseWorld Job Service')
        .setDescription('Production-oriented job ingestion, search, and admin API.')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build());
    swagger_1.SwaggerModule.setup('/docs', app, document);
    const preferredPort = config.get('port', { infer: true });
    const port = await findAvailablePort(preferredPort);
    if (port !== preferredPort && process.env.RENDER !== 'true' && process.env.NODE_ENV !== 'production') {
        bootstrapLogger.warn(`Port ${preferredPort} is busy. Starting job service on fallback port ${port}. Set PORT to override or free the original port.`);
    }
    await app.listen(port, '0.0.0.0');
    bootstrapLogger.log(`Job Service API listening on ${port}`);
}
bootstrap().catch((error) => {
    common_1.Logger.error(`Job Service API failed to start: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
//# sourceMappingURL=api.js.map