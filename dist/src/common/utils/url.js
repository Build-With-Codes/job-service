"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalizeUrl = canonicalizeUrl;
exports.isValidUrl = isValidUrl;
const TRACKING_PREFIXES = ['utm_', 'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'igshid'];
function canonicalizeUrl(raw) {
    const url = new URL(raw);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
        if (TRACKING_PREFIXES.some((prefix) => key.toLowerCase().startsWith(prefix))) {
            url.searchParams.delete(key);
        }
    }
    if (url.pathname !== '/') {
        url.pathname = url.pathname.replace(/\/+$/g, '');
    }
    return url.toString();
}
function isValidUrl(raw) {
    if (!raw)
        return false;
    try {
        new URL(raw);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=url.js.map