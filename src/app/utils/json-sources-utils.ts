import { JSON_SOURCE_FIELD_TITLE, JSON_SOURCE_FIELD_URL } from 'src/chat21-core/utils/constants';
import { JsonSourceItem } from 'src/app/component/message/json-sources/json-sources.component';
import { extractUrlsFromText } from './url-utils';

export function parseJsonSources(text?: string): JsonSourceItem[] | null {
  if (!text) return null;
  try {
    const parsed = parseJsonLenient(text);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.[JSON_SOURCE_FIELD_URL]) {
      const mapped = parsed
        .filter((x: any) => typeof x[JSON_SOURCE_FIELD_URL] === 'string')
        .map((x: any): JsonSourceItem => ({ link: x[JSON_SOURCE_FIELD_URL], title: x[JSON_SOURCE_FIELD_TITLE] || x[JSON_SOURCE_FIELD_URL] }));
      if (mapped.length > 0) return mapped;
    }
  } catch {
    // fall through
  }
  const urls = extractUrlsFromText(text, 10);
  return urls.length > 0 ? urls.map(url => ({ link: url, title: url })) : null;
}

function parseJsonLenient(input: string): any {
  const trimmed = (input || '').trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'string') {
      const inner = parsed.trim();
      if ((inner.startsWith('[') && inner.endsWith(']')) || (inner.startsWith('{') && inner.endsWith('}'))) {
        return parseJsonLenient(inner);
      }
    }
    return parsed;
  } catch {
    const cleaned = trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim()
      .replace(/,\s*([}\]])/g, '$1');
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'string') {
      const inner = parsed.trim();
      if ((inner.startsWith('[') && inner.endsWith(']')) || (inner.startsWith('{') && inner.endsWith('}'))) {
        return parseJsonLenient(inner);
      }
    }
    return parsed;
  }
}

export function extractUrlsFromJsonSources(sources: JsonSourceItem[] | null | undefined): string[] {
  return (sources || [])
    .map((s) => (s?.link || '').trim())
    .filter(Boolean);
}

export function mergeJsonSourcesMissingFields(
  base: JsonSourceItem[],
  previews: JsonSourceItem[]
): JsonSourceItem[] {
  const byUrl = new Map(previews.map((p) => [p.link, p]));
  return base.map((cur) => {
    const p = cur?.link ? byUrl.get(cur.link) : undefined;
    if (!p) return cur;
    return {
      ...cur,
      title: cur.title || p.title,
      description: cur.description || p.description,
      image: cur.image || p.image,
      favicon: cur.favicon || p.favicon,
      favicon_hd: cur.favicon_hd || p.favicon_hd
    };
  });
}

