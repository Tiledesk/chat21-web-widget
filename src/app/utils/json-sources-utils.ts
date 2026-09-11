import { JsonSourceItem } from 'src/app/component/message/json-sources/json-sources.component';

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

