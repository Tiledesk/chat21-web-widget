import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { Globals } from '../utils/globals';

export type UrlPreviewItem = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  favicon_hd?: string;
};

@Injectable({
  providedIn: 'root'
})
export class UrlPreviewService {
  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService,
    private g: Globals
  ) {}

  async previewUrls(urls: string[]): Promise<UrlPreviewItem[]> {
    const apiUrl = this.appConfigService.getConfig()?.apiUrl;
    const projectId = this.g.projectid;

    const cleaned = (urls || []).map((u) => (u || '').trim()).filter(Boolean).slice(0, 10);
    if (!apiUrl || !projectId || cleaned.length === 0) return [];

    const base = apiUrl.endsWith('/') ? apiUrl : apiUrl + '/';
    const url = `${base}${projectId}/url-preview`;

    const token = this.g.tiledeskToken;
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: token || ''
    });

    const body = { urls: cleaned };

    try {
      const res = await firstValueFrom(
        this.http.post<any>(url, body, { headers })
      );

      // Expected response:
      // [
      //   { url: "...", success: true, data: { url,title,description,image,siteName,... } },
      //   ...
      // ]
      // But we stay liberal and accept some alternative wrappers.
      const items: any[] = Array.isArray(res)
        ? res
        : (Array.isArray(res?.items) ? res.items : (Array.isArray(res?.data) ? res.data : []));

      return (items || [])
        .filter((x) => x && typeof x === 'object')
        .filter((x) => x.success !== false) // keep true/undefined, drop explicit failures
        .map((x) => {
          const d = x.data && typeof x.data === 'object' ? x.data : x;
          return {
            url: (d.url || x.url || x.link || '').toString(),
            title: typeof d.title === 'string' ? d.title : (typeof x.title === 'string' ? x.title : undefined),
            description: typeof d.description === 'string' ? d.description : (typeof x.description === 'string' ? x.description : undefined),
            image: typeof d.image === 'string' ? d.image : (typeof x.image === 'string' ? x.image : undefined),
            siteName: typeof d.siteName === 'string' ? d.siteName : undefined,
            favicon: typeof d.favicon === 'string' ? d.favicon : (typeof x.favicon === 'string' ? x.favicon : undefined),
            favicon_hd: typeof d.favicon_hd === 'string' ? d.favicon_hd : (typeof x.favicon_hd === 'string' ? x.favicon_hd : undefined)
          } as UrlPreviewItem;
        })
        .filter((x) => !!x.url);
    } catch {
      return [];
    }
  }
}

