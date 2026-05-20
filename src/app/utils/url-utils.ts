export function extractUrlsFromText(text?: string, maxUrls = 20): string[] {
  if (!text) return [];
  const input = text.toString();
  // Match candidates:
  // - https?://...
  // - www....
  // - naked domains like google.it/path
  // We later normalize + validate.
  const candidateRegex =
    /\b(?:https?:\/\/[^\s<>"'`)\]]+|www\.[^\s<>"'`)\]]+|[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+[^\s<>"'`)\]]*)/gi;
  const matches = input.match(candidateRegex) || [];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of matches) {
    const normalized = normalizeAndValidateUrlCandidate(raw);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
    if (out.length >= maxUrls) break;
  }
  return out;
}

function normalizeAndValidateUrlCandidate(candidate: string): string | null {
  if (!candidate) return null;
  let s = candidate.trim();

  // Drop surrounding punctuation/brackets commonly attached in text
  s = s.replace(/^[("'<\[]+/, '').replace(/[)"'>\]]+$/, '');
  // Drop trailing punctuation
  s = s.replace(/[.,;:!?]+$/g, '').trim();
  if (!s) return null;

  // Reject emails quickly
  if (s.includes('@')) return null;

  // Add scheme if missing
  if (/^www\./i.test(s)) {
    s = `https://${s}`;
  } else if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }

  try {
    const url = new URL(s);
    const hostname = url.hostname.toLowerCase();

    // must look like a real domain: contain a dot and a plausible TLD
    if (!hostname.includes('.')) return null;
    const tld = hostname.split('.').pop() || '';
    if (tld.length < 2) return null;
    if (!/^[a-z0-9-]+$/.test(tld)) return null;

    // normalize: remove default port and trailing slash when path is '/'
    url.hash = ''; // do not include fragments in "identity"
    if (url.pathname === '/') url.pathname = '';
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Best-effort "registrable domain" extractor.
 * Examples:
 * - "docs.example.com" -> "example.com"
 * - "www.example.co.uk" -> "example.co.uk"
 *
 * This is a heuristic (no publicsuffix list) but works well for common cases.
 */
export function getTopLevelDomainFromHostname(hostname: string): string {
  const host = (hostname || '').trim().toLowerCase().replace(/\.+$/, '');
  const parts = host.split('.').filter(Boolean);
  if (parts.length <= 2) return host;

  const tld = parts[parts.length - 1];
  const sld = parts[parts.length - 2];

  // Heuristic for common ccTLD second-level domains (co.uk, com.au, etc.)
  const commonSecondLevel = new Set(['co', 'com', 'org', 'net', 'gov', 'ac', 'edu']);
  const isCcTld = tld.length === 2;
  if (isCcTld && commonSecondLevel.has(sld) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

export function getTopLevelDomainFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return getTopLevelDomainFromHostname(hostname);
  } catch {
    return '';
  }
}

