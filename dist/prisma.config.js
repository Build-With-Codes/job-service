"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("prisma/config");
function withSchema(raw) {
    if (!raw)
        return undefined;
    try {
        const url = new URL(raw);
        url.searchParams.set('schema', url.searchParams.get('schema') || 'aiverse_jobs');
        return url.toString();
    }
    catch {
        return raw;
    }
}
const isMigrationCommand = process.argv.some((arg) => arg.includes('migrate') || arg.includes('db'));
const rawConnectionString = isMigrationCommand
    ? (process.env.DIRECT_URL ?? process.env.DATABASE_URL)
    : process.env.DATABASE_URL;
if (!rawConnectionString) {
    throw new Error('Missing DATABASE_URL. Set DATABASE_URL for runtime and DIRECT_URL for migrations.');
}
exports.default = (0, config_1.defineConfig)({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: withSchema(rawConnectionString),
    },
});
//# sourceMappingURL=prisma.config.js.map