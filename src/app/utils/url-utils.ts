export function extractUrlsFromText(text?: string, maxUrls = 20): string[] {
  if (!text) return [];
  const input = text.toString();
  const urlRegex = /https?:\/\/[^\s<>"'`)\]]+/gi;
  const matches = input.match(urlRegex) || [];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of matches) {
    const cleaned = raw.replace(/[.,;:!?]+$/g, '').trim();
    if (!cleaned) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= maxUrls) break;
  }
  return out;
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

