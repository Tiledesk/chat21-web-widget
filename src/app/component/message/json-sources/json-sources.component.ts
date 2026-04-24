import { Component, EventEmitter, Input, Output } from '@angular/core';

export type JsonSourceItem = {
  title?: string;
  link?: string;
  description?: string;
  favicon?: string;
  favicon_hd?: string;
  image?: string;
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

  @Output() onElementRendered = new EventEmitter<{ element: string; status: boolean }>();

  showAll = false;

  trackByLink = (_: number, item: JsonSourceItem) => item?.link || item?.title || _;

  ngAfterViewInit() {
    this.onElementRendered.emit({ element: 'json_sources', status: true });
  }

  getFavicon(item: JsonSourceItem): string | null {
    const explicit = (item?.favicon_hd || item?.favicon || '').trim();
    if (explicit) return explicit;
    const hostname = this.safeHostname(item?.link || '');
    if (!hostname) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
  }

  getHostname(item: JsonSourceItem): string {
    const hostname = this.safeHostname(item?.link || '');
    return hostname || '';
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

  get canExpand(): boolean {
    const normalizedLimit = Math.max(1, this.limit || 1);
    return (this.items?.length || 0) > normalizedLimit;
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
  }
}

