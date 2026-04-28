import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MessageModel } from 'src/chat21-core/models/message';
import { MESSAGE_TYPE_MINE, MESSAGE_TYPE_OTHERS, TYPE_MSG_URL_PREVIEW } from 'src/chat21-core/utils/constants';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';
import { calcImageSize, isAudio, isFile, isFrame, isImage, messageType } from 'src/chat21-core/utils/utils-message';
import { getColorBck } from 'src/chat21-core/utils/utils-user';
import { UrlPreviewService } from 'src/app/providers/url-preview.service';
import { extractUrlsFromText } from 'src/app/utils/url-utils';
import { extractUrlsFromJsonSources, mergeJsonSourcesMissingFields, parseJsonSources } from 'src/app/utils/json-sources-utils';
import { JsonSourceItem } from '../json-sources/json-sources.component';

@Component({
  selector: 'chat-bubble-message',
  templateUrl: './bubble-message.component.html',
  styleUrls: ['./bubble-message.component.scss']
})
export class BubbleMessageComponent {

  @Input() message: MessageModel;
  @Input() isSameSender: boolean;
  @Input() fontColor: string;
  @Input() stylesMap: Map<string, string>;

  @Output() onBeforeMessageRender = new EventEmitter();
  @Output() onAfterMessageRender = new EventEmitter();
  @Output() onElementRendered = new EventEmitter<{ element: string; status: boolean }>();

  @HostBinding('class.no-background') get hostNoBackground() { return this.jsonSources !== null && this.jsonSources.length > 0; }
  @HostBinding('class.json-resources') get hostIsJsonResources() { return this.jsonSources !== null && this.jsonSources.length > 0; }

  readonly isImage = isImage;
  readonly isFile = isFile;
  readonly isFrame = isFrame;
  readonly isAudio = isAudio;
  readonly messageType = messageType;
  readonly convertColorToRGBA = convertColorToRGBA;
  readonly MESSAGE_TYPE_MINE = MESSAGE_TYPE_MINE;
  readonly MESSAGE_TYPE_OTHERS = MESSAGE_TYPE_OTHERS;

  sizeImage: { width: number; height: number };
  fullnameColor: string;
  jsonSources: JsonSourceItem[] | null = null;

  private urlPreviewReqId = 0;

  constructor(public sanitizer: DomSanitizer, private urlPreviewService: UrlPreviewService) {}

  ngOnChanges(): void {
    if (this.message?.metadata && typeof this.message.metadata === 'object') {
      this.sizeImage = calcImageSize(this.message.metadata);
    }

    this.fullnameColor = this.fontColor
      ? convertColorToRGBA(this.fontColor, 65)
      : this.fullnameColor;

    if (this.message?.sender_fullname?.trim()) {
      this.fullnameColor = getColorBck(this.message.sender_fullname);
    }

    if (this.message?.type !== TYPE_MSG_URL_PREVIEW) {
      this.jsonSources = null;
      return;
    }

    const parsedSources = parseJsonSources(this.message.text);
    this.jsonSources = parsedSources;

    const sourcesUrls = extractUrlsFromJsonSources(parsedSources).slice(0, 10);
    const urls = sourcesUrls.length > 0 ? sourcesUrls : extractUrlsFromText(this.message.text, 10);

    this.enrichWithUrlPreview(urls, parsedSources);
  }

  onBeforeMessageRenderFN(event: any): void {
    this.onBeforeMessageRender.emit({ message: this.message, sanitizer: this.sanitizer, messageEl: event.messageEl, component: event.component });
  }

  onAfterMessageRenderFN(event: any): void {
    this.onAfterMessageRender.emit({ message: this.message, sanitizer: this.sanitizer, messageEl: event.messageEl, component: event.component });
  }

  onElementRenderedFN(event: any): void {
    this.onElementRendered.emit({ element: event.element, status: event.status });
  }

  private async enrichWithUrlPreview(urls: string[], baseSources: JsonSourceItem[] | null): Promise<void> {
    if (urls.length === 0) return;

    const reqId = ++this.urlPreviewReqId;
    const items = await this.urlPreviewService.previewUrls(urls);
    if (reqId !== this.urlPreviewReqId) return;

    const previewItems: JsonSourceItem[] = (items || []).map(x => ({
      title: x.title || x.siteName || x.url,
      link: x.url,
      description: x.description,
      image: x.image,
      favicon: x.favicon,
      favicon_hd: x.favicon_hd
    }));

    if (previewItems.length === 0) return;

    if (baseSources?.length) {
      this.jsonSources = mergeJsonSourcesMissingFields(baseSources, previewItems);
    } else if (this.jsonSources === null) {
      this.jsonSources = previewItems;
    }
  }
}
