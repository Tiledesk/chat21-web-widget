import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MessageModel } from 'src/chat21-core/models/message';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { MAX_WIDTH_IMAGES, MESSAGE_TYPE_MINE, MESSAGE_TYPE_OTHERS, MIN_WIDTH_IMAGES } from 'src/chat21-core/utils/constants';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';
import { isAudio, isFile, isFrame, isImage, messageType } from 'src/chat21-core/utils/utils-message';
import { getColorBck } from 'src/chat21-core/utils/utils-user';
import { JsonSourceItem } from '../json-sources/json-sources.component';

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
  @HostBinding('class.no-background') get hostNoBackground() {
    // When rendering json_resources we want the inner panel to define visuals,
    // not the standard chat bubble background.
    return this.jsonSources !== null;
  }
  @HostBinding('class.json-resources') get hostIsJsonResources() {
    return this.jsonSources !== null;
  }
  private logger: LoggerService = LoggerInstance.getInstance()
  constructor(public sanitizer: DomSanitizer) { }

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

    this.jsonSources = this.parseJsonSources(this.message?.text);

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
      return this.mapResources(resources);
    } catch (e) {
      return null;
    }
  }

  private parseJsonLenient(input: string): any {
    const trimmed = (input || '').trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      // common cases in chat messages:
      // - markdown code fences ```json ... ```
      // - trailing commas before } or ]
      const withoutFences = trimmed
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      const withoutTrailingCommas = withoutFences.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(withoutTrailingCommas);
    }
  }

  private mapResources(resources: any[]): JsonSourceItem[] {
    return (resources || [])
      .filter((x: any) => x && typeof x === 'object')
      .map((x: any) => ({
        title: typeof x.title === 'string' ? x.title : undefined,
        link: typeof x.link === 'string' ? x.link : undefined,
        description: typeof x.description === 'string' ? x.description : undefined,
        favicon: typeof x.favicon === 'string' ? x.favicon : undefined,
        favicon_hd: typeof x.favicon_hd === 'string' ? x.favicon_hd : undefined,
        image: typeof x.image === 'string' ? x.image : undefined,
      }));
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
