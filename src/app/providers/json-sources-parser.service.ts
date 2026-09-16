import { Injectable } from '@angular/core';
import { JSON_SOURCE_FIELD_TITLE, JSON_SOURCE_FIELD_URL } from 'src/chat21-core/utils/constants';
import { UrlPreviewService } from 'src/app/providers/url-preview.service';
import { extractUrlsFromText } from 'src/app/utils/url-utils';
import { JsonSourceItem } from 'src/app/component/message/json-sources/json-sources.component';
import { mergeJsonSourcesMissingFields } from 'src/app/utils/json-sources-utils';

export type UrlPreviewDisplayFields = {
  title?: boolean;
  description?: boolean;
  image?: boolean;
  source?: boolean;
};

export type UrlPreviewMessage = {
  type?: string; // "url_preview"
  text?: string;
  displayFields?: UrlPreviewDisplayFields;
  previewBackgroundColor?: string;
};

/**
 * Parse and enrich "url_preview" messages into `JsonSourceItem[]`.
 *
 * Rules:
 * - The payload is always read from `msg.text`, regardless of `activeMode`.
 * - `msg.text` may be either:
 *     - a JSON array of source objects (`{source_name, source_file_name, ...}`), or
 *     - a plain string from which URLs are extracted (split by whitespace/punctuation).
 * - After building the initial array, `url-preview` is called only for items that miss
 *   title or description, and missing fields are merged in (never overwriting).
 */
@Injectable({ providedIn: 'root' })
export class JsonSourcesParserService {
  constructor(private urlPreviewService: UrlPreviewService) {}

  /**
   * Parse-only: returns sources immediately (no url-preview calls).
   * Use this to render the list instantly, then call `enrichSources()` in background.
   */
  parseBaseFromMessage(messageLike?: any): JsonSourceItem[] | null {
    const payload = this.getUrlPreviewPayload(messageLike);
    return this.parseBaseJsonSources(payload);
  }

  /**
   * Parse + enrich: kept for backward compatibility with older callers.
   * If you need instant rendering, prefer `parseBaseFromMessage()` + `enrichSources()`.
   */
  /**
   * Best-practice entrypoint for UI components:
   * accepts a full `MessageModel`/message-like object, and supports url_preview payload
   * living either on the root message OR inside `metadata` OR inside `attributes`.
   */
  async parseFromMessage(messageLike?: any): Promise<JsonSourceItem[] | null> {
    const base = this.parseBaseFromMessage(messageLike);
    return this.enrichSources(base);
  }

  async enrichSources(baseSources?: JsonSourceItem[] | null): Promise<JsonSourceItem[] | null> {
    const sources = (baseSources || []).filter((s) => !!s?.link);
    if (sources.length === 0) return baseSources || null;

    // Only call url-preview for items missing the most relevant fields.
    const incompleteUrls = sources
      .filter(s => !!s.link && (!s.title || !s.description))
      .map(s => s.link!)
      .slice(0, 10);

    if (incompleteUrls.length === 0) return sources;

    const previews = await this.urlPreviewService.previewUrls(incompleteUrls);
    const previewItems: JsonSourceItem[] = (previews || []).map(p => ({
      link: p.url,
      title: p.title || p.siteName || p.url,
      description: p.description,
      image: p.image,
      favicon: p.favicon,
      favicon_hd: p.favicon_hd
    }));

    if (previewItems.length === 0) return sources;
    return mergeJsonSourcesMissingFields(sources, previewItems);
  }

  async parseJsonSources(msg?: UrlPreviewMessage | null): Promise<JsonSourceItem[] | null> {
    const base = this.parseBaseJsonSources(msg);
    return this.enrichSources(base);
  }

  /**
   * Public: lets callers (UI components) read the raw `url_preview` payload to
   * extract presentation options like `displayFields` or `previewBackgroundColor`.
   */
  getUrlPreviewPayload(messageLike?: any): UrlPreviewMessage | null {
    if (!messageLike) return null;
    const candidates: any[] = [
      messageLike,
      (messageLike?.metadata && typeof messageLike.metadata === 'object') ? messageLike.metadata : null,
      (messageLike?.attributes && typeof messageLike.attributes === 'object') ? messageLike.attributes : null
    ].filter(Boolean);
    return (candidates.find((c) => c?.type === 'url_preview') || null) as UrlPreviewMessage | null;
  }

  private parseBaseJsonSources(msg?: UrlPreviewMessage | null): JsonSourceItem[] | null {
    if (!msg || msg.type !== 'url_preview') return null;

    // Regardless of `activeMode`, the payload is always read from `msg.text`.
    // It can be either a JSON array of source objects, or a plain string with URLs.
    return this.isJsonArrayOfObjects(msg.text)
      ? this.mapTextToSources(msg.text)
      : this.mapListToSources(msg.text);
  }

  private mapListToSources(listValue?: string): JsonSourceItem[] | null {
    const urls = extractUrlsFromText((listValue || '').toString(), 10);
    return urls.length ? urls.map(u => ({ link: u, title: u })) : null;
  }

  private isJsonArrayOfObjects(text?: string): boolean {
    if (!text) return false;
    try {
      const parsed = this.parseJsonLenient(text);
      return Array.isArray(parsed) && parsed.some(it => it && typeof it === 'object' && !Array.isArray(it));
    } catch {
      return false;
    }
  }

  private mapTextToSources(text?: string): JsonSourceItem[] | null {
    if (!text) return null;
    try {
      const parsed = this.parseJsonLenient(text);
      return this.mapSourcesArray(parsed);
    } catch {
      return null;
    }
  }

  private mapSourcesArray(input: any): JsonSourceItem[] | null {
    const arr = Array.isArray(input) ? input : null;
    if (!arr || arr.length === 0) return null;
    const mapped = arr
      .filter((s: any) => s && typeof s === 'object' && typeof s[JSON_SOURCE_FIELD_URL] === 'string')
      .map((s: any): JsonSourceItem | null => {
        const rawUrl = (s[JSON_SOURCE_FIELD_URL] || '').toString().trim();
        const normalized = extractUrlsFromText(rawUrl, 1)[0];
        if (!normalized) return null;
        return {
          link: normalized,
          title: (s[JSON_SOURCE_FIELD_TITLE] || rawUrl).toString(),
          description: typeof s.source_description === 'string' ? s.source_description : undefined,
          image: typeof s.source_image === 'string' ? s.source_image : undefined
        };
      })
      .filter((x: JsonSourceItem | null): x is JsonSourceItem => !!x && !!x.link);
    return mapped.length ? mapped : null;
  }

  private parseJsonLenient(input: string): any {
    const trimmed = (input || '').trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string') {
        const inner = parsed.trim();
        if ((inner.startsWith('[') && inner.endsWith(']')) || (inner.startsWith('{') && inner.endsWith('}'))) {
          return this.parseJsonLenient(inner);
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
          return this.parseJsonLenient(inner);
        }
      }
      return parsed;
    }
  }
}

