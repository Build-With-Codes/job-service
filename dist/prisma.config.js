"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("prisma/config");
function withSchema(raw) {
    if (!raw)
        return undefined;
    try {
        const url = new URL(raw);
        url.searchParams.set('schema', 'aiverse_jobs');
        return url.toString();
    }
    catch {
        return raw;
    }
}
function isLikelyPoolerUrl(raw) {
    if (!raw)
        return false;
    try {
        const url = new URL(raw);
        return url.hostname.includes('pooler.supabase.com') || url.port === '6543';
    }
    catch {
        return raw.includes('pooler.supabase.com') || raw.includes(':6543');
    }
}
const isMigrationCommand = process.argv.some((arg) => arg.includes('migrate') || arg.includes('db'));
const directConnectionString = process.env.DIRECT_URL ?? process.env.DIRECT_DATABASE_URL;
const rawConnectionString = isMigrationCommand
    ? (directConnectionString ?? process.env.DATABASE_URL)
    : process.env.DATABASE_URL;
if (!rawConnectionString) {
    throw new Error('Missing DATABASE_URL. Set DATABASE_URL for runtime and DIRECT_URL for migrations.');
}
if (isMigrationCommand && !directConnectionString && isLikelyPoolerUrl(rawConnectionString)) {
    throw new Error('Prisma migrations cannot run through the Supabase pooler connection. Set DIRECT_URL or DIRECT_DATABASE_URL to the direct PostgreSQL connection string for migrations.');
}
exports.default = (0, config_1.defineConfig)({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: withSchema(rawConnectionString),
    },
});
//# sourceMappingURL=prisma.config.js.map