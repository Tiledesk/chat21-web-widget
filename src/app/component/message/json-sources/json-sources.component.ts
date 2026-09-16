import { Component, EventEmitter, Input, Output } from '@angular/core';
import { getTopLevelDomainFromUrl } from 'src/app/utils/url-utils';

export type JsonSourceItem = {
  title?: string;
  link?: string;
  description?: string;
  favicon?: string;
  favicon_hd?: string;
  image?: string;
};

export type JsonSourcesDisplayFields = {
  title?: boolean;
  description?: boolean;
  image?: boolean;
  source?: boolean;
};

@Component({
  selector: 'chat-json-sources',
  templateUrl: './json-sources.component.html',
  styleUrls: ['./json-sources.component.scss']
})
export class JsonSourcesComponent {
  @Input() items: JsonSourceItem[] = [];
  @Input() themeColor?: string;
  @Input() limit = 3;
  // Optional: per-field visibility. Missing/undefined fields default to visible
  // (only an explicit `false` hides the field).
  @Input() displayFields?: JsonSourcesDisplayFields;
  // Optional: background color override for the sources panel.
  @Input() backgroundColor?: string;

  @Output() onElementRendered = new EventEmitter<{ element: string; status: boolean }>();

  showAll = false;

  isFieldVisible(field: keyof JsonSourcesDisplayFields): boolean {
    return this.displayFields?.[field] !== false;
  }

  // Title is always rendered: when its content is missing or the field is
  // hidden via displayFields, we fall back to the item URL so the row is never
  // left without a label.
  getTitleText(item: JsonSourceItem): string {
    const titleVisible = this.isFieldVisible('title');
    const title = (item?.title || '').trim();
    if (titleVisible && title) return title;
    return (item?.link || '').trim();
  }

  trackByLink = (_: number, item: JsonSourceItem) => item?.link || item?.title || _;

  ngAfterViewInit() {
    this.onElementRendered.emit({ element: 'json_sources', status: true });
  }

  getFavicon(item: JsonSourceItem): string | null {
    const domain = getTopLevelDomainFromUrl(item?.link || '');
    if (!domain) return null;
    const explicit = (item?.favicon_hd || item?.favicon || '').trim();
    if (explicit) {
      try {
        const faviconDomain = getTopLevelDomainFromUrl(explicit);
        return faviconDomain ? explicit.replace(new URL(explicit).hostname, faviconDomain) : explicit;
      } catch {
        return explicit;
      }
    }
    return `https://favicon.im/${domain}`;
    //return `https://${domain}/favicon.ico`;
  }

  getHostname(item: JsonSourceItem): string {
    const hostname = this.safeHostname(item?.link || '');
    return hostname || '';
  }

  // Route large source images through wsrv.nl which downsamples them server-side
  // to a thumbnail-sized version. Rendering at ~3x the CSS size keeps the result
  // sharp on retina displays. Falls back to the original URL on any error.
  getThumbUrl(item: JsonSourceItem): string {
    const raw = (item?.image || '').trim();
    if (!raw) return '';
    if (!/^https?:\/\//i.test(raw)) return raw;
    try {
      const stripped = raw.replace(/^https?:\/\//i, '');
      const encoded = encodeURIComponent(stripped);
      return `https://wsrv.nl/?url=${encoded}&w=120&h=120&fit=cover&output=webp&n=-1`;
    } catch {
      return raw;
    }
  }

  private safeHostname(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  get visibleItems(): JsonSourceItem[] {
    if (!this.items) return [];
    const normalizedLimit = Math.max(1, this.limit || 1);
    return this.showAll ? this.items : this.items.slice(0, normalizedLimit);
  }

  get headerFavicons(): JsonSourceItem[] {
    const seen = new Set<string>();
    return (this.items || []).reduce<JsonSourceItem[]>((acc, item) => {
      const url = this.getFavicon(item);
      if (url && !seen.has(url)) {
        seen.add(url);
        acc.push(item);
      }
      return acc;
    }, []).slice(0, 3);
  }

  get canExpand(): boolean {
    const normalizedLimit = Math.max(1, this.limit || 1);
    return (this.items?.length || 0) > normalizedLimit;
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
  }
}

