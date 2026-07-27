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
const app_module_1 = require("./app.module");
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
    const port = config.get('port', { infer: true });
    await app.listen(port);
    common_1.Logger.log(`Job Service API listening on ${port}`);
}
bootstrap().catch((error) => {
    common_1.Logger.error(`Job Service API failed to start: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
//# sourceMappingURL=api.js.map