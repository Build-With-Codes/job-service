const TRACKING_PREFIXES = ['utm_', 'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'igshid'];

export function canonicalizeUrl(raw: string) {
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

export function isValidUrl(raw: string | undefined | null): raw is string {
  if (!raw) return false;
  try {
    new URL(raw);
    return true;
  } catch {
    return false;
  }
}
