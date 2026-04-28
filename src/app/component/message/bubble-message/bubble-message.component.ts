import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MessageModel } from 'src/chat21-core/models/message';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { MAX_WIDTH_IMAGES, MESSAGE_TYPE_MINE, MESSAGE_TYPE_OTHERS, MIN_WIDTH_IMAGES, TYPE_MSG_URL_PREVIEW } from 'src/chat21-core/utils/constants';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';
import { isAudio, isFile, isFrame, isImage, messageType } from 'src/chat21-core/utils/utils-message';
import { getColorBck } from 'src/chat21-core/utils/utils-user';
import { JsonSourceItem } from '../json-sources/json-sources.component';
import { UrlPreviewService } from 'src/app/providers/url-preview.service';
import { extractUrlsFromText } from 'src/app/utils/url-utils';
import { extractUrlsFromJsonSources, mergeJsonSourcesMissingFields } from 'src/app/utils/json-sources-utils';

@Component({
  selector: 'chat-bubble-message',
  templateUrl: './bubble-message.component.html',
  styleUrls: ['./bubble-message.component.scss']
})
export class BubbleMessageComponent implements OnInit {

  @Input() message: MessageModel;
  @Input() isSameSender: boolean;
  @Input() fontColor: string;
  @Input() stylesMap: Map<string, string>;
  @Output() onBeforeMessageRender = new EventEmitter();
  @Output() onAfterMessageRender = new EventEmitter();
  @Output() onElementRendered = new EventEmitter<{element: string, status: boolean}>();
  isImage = isImage;
  isFile = isFile;
  isFrame = isFrame;
  isAudio = isAudio;
  convertColorToRGBA = convertColorToRGBA

 // ========== begin:: check message type functions ======= //
  messageType = messageType;

  MESSAGE_TYPE_MINE = MESSAGE_TYPE_MINE;
  MESSAGE_TYPE_OTHERS = MESSAGE_TYPE_OTHERS;
 // ========== end:: check message type functions ======= //
  sizeImage : { width: number, height: number}
  fullnameColor: string;
  jsonSources: JsonSourceItem[] | null = null;
  private urlPreviewReqId = 0;
  @HostBinding('class.no-background') get hostNoBackground() {
    // When rendering json_resources we want the inner panel to define visuals,
    // not the standard chat bubble background.
    return this.jsonSources !== null;
  }
  @HostBinding('class.json-resources') get hostIsJsonResources() {
    return this.jsonSources !== null;
  }
  private logger: LoggerService = LoggerInstance.getInstance()
  constructor(
    public sanitizer: DomSanitizer,
    private urlPreviewService: UrlPreviewService
  ) { }

  ngOnInit() {
    // console.log("---- > MSG:", this.message);
  }

  ngOnChanges() {
    if (this.message && this.message.metadata && typeof this.message.metadata === 'object' ) {
      this.sizeImage = this.getMetadataSize(this.message.metadata)
    }

    if(this.fontColor){
      this.fullnameColor = convertColorToRGBA(this.fontColor, 65)
    }
    if(this.message && this.message.sender_fullname && this.message.sender_fullname.trim() !== ''){
      this.fullnameColor = getColorBck(this.message.sender_fullname)
    }

    if (this.message?.type !== TYPE_MSG_URL_PREVIEW) {
      this.jsonSources = null;
      return;
    }

    const parsedSources = this.parseJsonSources(this.message?.text);
    this.jsonSources = parsedSources;

    // 1) extract urls from parsed jsonSources (if any)
    const urlsFromJsonSources = extractUrlsFromJsonSources(parsedSources).slice(0, 10);

    // 2) fallback: extract urls from raw text
    const urls = urlsFromJsonSources.length > 0
      ? urlsFromJsonSources
      : extractUrlsFromText(this.message?.text, 10);

    // 3) async enrich via service and merge into jsonSources
    this.tryUrlPreviewFromMessage(urls, parsedSources);

  }

  private async tryUrlPreviewFromMessage(urls: string[], baseSources: JsonSourceItem[] | null): Promise<void> {
    if (urls.length === 0) return;

    const reqId = ++this.urlPreviewReqId;
    const previewItems = await this.fetchUrlPreviewObjects(urls);
    if (reqId !== this.urlPreviewReqId) return; // stale response

    if (previewItems.length > 0) {
      const current = baseSources && baseSources.length > 0 ? baseSources : null;
      if (current) {
        this.jsonSources = mergeJsonSourcesMissingFields(current, previewItems);
      } else if (this.jsonSources === null) {
        // If message wasn't a jsonSources payload, show preview results as sources.
        this.jsonSources = previewItems;
      }
    }
  }

  /**
   * Given a list of URLs, calls POST {{base_url}}/{{id_project}}/url-preview
   * and maps the response to JsonSourceItem[] for the UI component.
   */
  private async fetchUrlPreviewObjects(urls: string[]): Promise<JsonSourceItem[]> {
    const items = await this.urlPreviewService.previewUrls(urls);
    return (items || []).map((x) => ({
      title: x.title || x.siteName || x.url,
      link: x.url,
      description: x.description,
      image: x.image,
      favicon: x.favicon,
      favicon_hd: x.favicon_hd
    }));
  }

  private parseJsonSources(text?: string): JsonSourceItem[] | null {
    if (!text) return null;
    try {
      const parsed = this.parseJsonLenient(text);

      // Supported formats:
      // 1) Legacy: [ { title, link, ... }, ... ]
      // 2) Envelope: { kind: "json_resources", version: 1, resources: [ ... ] }
      let resources: any[] | null = null;
      if (Array.isArray(parsed)) {
        resources = parsed;
      } else if (
        parsed &&
        typeof parsed === 'object' &&
        (parsed as any).kind === 'json_resources' &&
        Array.isArray((parsed as any).resources)
      ) {
        resources = (parsed as any).resources;
      }

      // Necessary and sufficient condition (as requested):
      // kind === "json_resources" AND resources is an array (even empty).
      // For legacy arrays we still support them, but they must contain at least one object.
      if (parsed && typeof parsed === 'object' && (parsed as any).kind === 'json_resources') {
        return resources ? this.mapResources(resources) : null;
      }
      if (!resources || resources.length === 0) return null;
      const mapped = this.mapResources(resources);
      return mapped.length > 0 ? mapped : null;
    } catch (e) {
      return null;
    }
  }

  private parseJsonLenient(input: string): any {
    const trimmed = (input || '').trim();
    try {
      const parsed = JSON.parse(trimmed);
      // Sometimes JSON arrives as a *stringified JSON* (escaped quotes), e.g. "\"[{...}]\"".
      // If so, parse one more time (best-effort).
      if (typeof parsed === 'string') {
        const inner = parsed.trim();
        if (
          (inner.startsWith('[') && inner.endsWith(']')) ||
          (inner.startsWith('{') && inner.endsWith('}'))
        ) {
          return this.parseJsonLenient(inner);
        }
      }
      return parsed;
    } catch {
      // common cases in chat messages:
      // - markdown code fences ```json ... ```
      // - trailing commas before } or ]
      const withoutFences = trimmed
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      const withoutTrailingCommas = withoutFences.replace(/,\s*([}\]])/g, '$1');
      const parsed = JSON.parse(withoutTrailingCommas);
      if (typeof parsed === 'string') {
        const inner = parsed.trim();
        if (
          (inner.startsWith('[') && inner.endsWith(']')) ||
          (inner.startsWith('{') && inner.endsWith('}'))
        ) {
          return this.parseJsonLenient(inner);
        }
      }
      return parsed;
    }
  }

  private mapResources(resources: any[]): JsonSourceItem[] {
    return (resources || [])
      .filter((x: any) => x && typeof x === 'object')
      .map((x: any) => {
        // Support alternative schema:
        // [{ source_name: <url>, source_file_name: <title> }, ...]
        const sourceName = typeof x.source_name === 'string' ? x.source_name : undefined;
        const sourceFileName = typeof x.source_file_name === 'string' ? x.source_file_name : undefined;
        if (sourceName && sourceFileName) {
          return {
            title: sourceFileName,
            link: sourceName
          } as JsonSourceItem;
        }
        return {
          title: typeof x.title === 'string' ? x.title : undefined,
          link: typeof x.link === 'string' ? x.link : undefined,
          description: typeof x.description === 'string' ? x.description : undefined,
          favicon: typeof x.favicon === 'string' ? x.favicon : undefined,
          favicon_hd: typeof x.favicon_hd === 'string' ? x.favicon_hd : undefined,
          image: typeof x.image === 'string' ? x.image : undefined,
        } as JsonSourceItem;
      })
      .filter((it: JsonSourceItem) => !!it.link && !!it.title);
  }

  /**
   *
   * @param message
   */
  // getMetadataSize(metadata): any {
  //   if(metadata.width === undefined){
  //     metadata.width= MAX_WIDTH_IMAGES
  //   }
  //   if(metadata.height === undefined){
  //     metadata.height = MAX_WIDTH_IMAGES
  //   }
  //   // const MAX_WIDTH_IMAGES = 300;
  //   const sizeImage = {
  //       width: metadata.width,
  //       height: metadata.height
  //   };
  //   //   that.g.wdLog(['message::: ', metadata);
  //   if (metadata.width && metadata.width > MAX_WIDTH_IMAGES) {
  //       const rapporto = (metadata['width'] / metadata['height']);
  //       sizeImage.width = MAX_WIDTH_IMAGES;
  //       sizeImage.height = MAX_WIDTH_IMAGES / rapporto;
  //   }
  //   return sizeImage; // h.toString();
  // }

  /**
   *
   * @param message
   */
  getMetadataSize(metadata): {width, height} {
    // if (metadata.width === undefined) {
    //   metadata.width = MAX_WIDTH_IMAGES
    // }
    // if (metadata.height === undefined) {
    //   metadata.height = MAX_WIDTH_IMAGES
    // }

    const sizeImage = {
      width: metadata.width,
      height: metadata.height
    };


    if (metadata.width && metadata.width < MAX_WIDTH_IMAGES) {
      if (metadata.width <= 55) {
        const ratio = (metadata['width'] / metadata['height']);
        sizeImage.width = MIN_WIDTH_IMAGES;
        sizeImage.height = MIN_WIDTH_IMAGES / ratio;
      } else if (metadata.width > 55) {
        sizeImage.width = metadata.width;
        sizeImage.height = metadata.height
      }
    } else if (metadata.width && metadata.width > MAX_WIDTH_IMAGES) {
      const ratio = (metadata['width'] / metadata['height']);
      sizeImage.width = MAX_WIDTH_IMAGES;
      sizeImage.height = MAX_WIDTH_IMAGES / ratio;
    }
    return sizeImage
  }

  // ========= begin:: event emitter function ============//

  // returnOpenAttachment(event: String) {
  //   this.onOpenAttachment.emit(event)
  // }

  // /** */
  // returnClickOnAttachmentButton(event: any) {
  //   this.onClickAttachmentButton.emit(event)
  // }

  onBeforeMessageRenderFN(event){
    const messageOBJ = { message: this.message, sanitizer: this.sanitizer, messageEl: event.messageEl, component: event.component}
    this.onBeforeMessageRender.emit(messageOBJ)
  }

  onAfterMessageRenderFN(event){
    const messageOBJ = { message: this.message, sanitizer: this.sanitizer, messageEl: event.messageEl, component: event.component}
    this.onAfterMessageRender.emit(messageOBJ)
  }

  onElementRenderedFN(event){
    this.onElementRendered.emit({element: event.element, status: event.status})
  }

  // ========= END:: event emitter function ============//


}
