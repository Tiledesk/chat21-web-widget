import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MessageModel } from 'src/chat21-core/models/message';
import { MESSAGE_TYPE_MINE, MESSAGE_TYPE_OTHERS, TYPE_MSG_URL_PREVIEW } from 'src/chat21-core/utils/constants';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';
import { calcImageSize, isAudio, isAudioTTS, isFile, isFrame, isImage, messageType } from 'src/chat21-core/utils/utils-message';
import { getColorBck } from 'src/chat21-core/utils/utils-user';
import { VoiceService } from 'src/app/providers/voice/voice.service';
import { UrlPreviewService } from 'src/app/providers/url-preview.service';
import { extractUrlsFromText } from 'src/app/utils/url-utils';
import { extractUrlsFromJsonSources, mergeJsonSourcesMissingFields, parseJsonSources } from 'src/app/utils/json-sources-utils';
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
  /** When true, a newly-arrived bot text message reveals its words one by one. */
  @Input() streamOnArrival = false;
  /** One-shot flag: set once in ngOnChanges, never reverts so animation isn't replayed. */
  _isStreaming = false;
  /** Precomputed word list; rebuilt only when the message text changes. */
  _streamingWords: Array<{ word: string; index: number }> = [];
  @Output() onBeforeMessageRender = new EventEmitter();
  @Output() onAfterMessageRender = new EventEmitter();
  @Output() onElementRendered = new EventEmitter<{ element: string; status: boolean }>();

  @HostBinding('class.no-background') get hostNoBackground() { return this.jsonSources !== null && this.jsonSources.length > 0; }
  @HostBinding('class.json-resources') get hostIsJsonResources() { return this.jsonSources !== null && this.jsonSources.length > 0; }

  readonly isImage = isImage;
  readonly isFile = isFile;
  readonly isFrame = isFrame;
  readonly isAudio = isAudio;
  readonly isAudioTTS = isAudioTTS;
  readonly messageType = messageType;
  readonly convertColorToRGBA = convertColorToRGBA;
  readonly MESSAGE_TYPE_MINE = MESSAGE_TYPE_MINE;
  readonly MESSAGE_TYPE_OTHERS = MESSAGE_TYPE_OTHERS;

  sizeImage: { width: number; height: number } = { width: 0, height: 0 };
  fullnameColor: string = '';
  jsonSources: JsonSourceItem[] | null = null;

  private urlPreviewReqId = 0;

  constructor(public sanitizer: DomSanitizer, public voiceService: VoiceService, private urlPreviewService: UrlPreviewService) { }

  ngOnInit() {
    // If this TTS message arrived while the voice proxy was active, mark it so
    // audio-sync never replays it after the session ends.
    if (isAudioTTS(this.message) && this.voiceService.isWssVoiceActive && this.message?.uid) {
      this.voiceService.markProxyHandled(this.message.uid);
    }
  }

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

    // One-shot: activate word streaming for newly-arrived bot text messages during a voice session.
    // Reset isJustRecived so the animation never replays on subsequent change detection cycles.
    if (
      !this._isStreaming &&
      this.streamOnArrival &&
      this.message?.isJustRecived === true &&
      this.messageType(this.MESSAGE_TYPE_OTHERS, this.message) &&
      !this.isAudio(this.message) &&
      !this.isAudioTTS(this.message) &&
      this.message?.type !== 'html'
    ) {
      this._isStreaming = true;
      this._streamingWords = (this.message.text ?? '')
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 0)
        .map((word, index) => ({ word, index }));
      this.message.isJustRecived = false;
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

  trackWord(_index: number, item: { word: string; index: number }): number {
    return item.index;
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
