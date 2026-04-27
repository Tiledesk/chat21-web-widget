import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MessageModel } from 'src/chat21-core/models/message';
import { MESSAGE_TYPE_MINE, MESSAGE_TYPE_OTHERS } from 'src/chat21-core/utils/constants';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';
import { calcImageSize, isAudio, isAudioTTS, isFile, isFrame, isImage, isJsonSources, messageType } from 'src/chat21-core/utils/utils-message';
import { getColorBck } from 'src/chat21-core/utils/utils-user';
import { JsonSourcesParserService, UrlPreviewDisplayFields } from 'src/app/providers/json-sources-parser.service';
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
  @HostBinding('class.hidden-bubble') get hostHiddenBubble() { return !this.hasRenderableContent(); }

  hasRenderableContent(): boolean {
    const msg = this.message;
    if (!msg) return false;
    if (isImage(msg) || isFile(msg) || isFrame(msg) || isAudio(msg)) return true;
    if (this.jsonSources && this.jsonSources.length > 0) return true;
    // For url_preview messages, `text` may carry the raw JSON payload (not display text):
    // if sources parsing yielded nothing, the bubble must stay hidden.
    if (this.isUrlPreviewMessage) return false;
    return !!(msg.text && String(msg.text).trim().length > 0);
  }

  readonly isImage = isImage;
  readonly isFile = isFile;
  readonly isFrame = isFrame;
  readonly isAudio = isAudio;
  readonly isAudioTTS = isAudioTTS;
  readonly isJsonSources = isJsonSources;
  readonly messageType = messageType;
  readonly convertColorToRGBA = convertColorToRGBA;
  readonly MESSAGE_TYPE_MINE = MESSAGE_TYPE_MINE;
  readonly MESSAGE_TYPE_OTHERS = MESSAGE_TYPE_OTHERS;

  sizeImage: { width: number; height: number };
  fullnameColor: string;
  jsonSources: JsonSourceItem[] | null = null;
  isUrlPreviewMessage = false;
  jsonSourcesDisplayFields?: UrlPreviewDisplayFields;
  jsonSourcesBackgroundColor?: string;

  private urlPreviewReqId = 0;

  constructor(
    public sanitizer: DomSanitizer,
    private jsonSourcesParser: JsonSourcesParserService
  ) {}

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

    // Reset on every message change: we must not "leak" sources across different messages.
    this.jsonSources = null;
    this.jsonSourcesDisplayFields = undefined;
    this.jsonSourcesBackgroundColor = undefined;

    // url_preview payload can live on message root OR inside metadata/attributes depending on the integration.
    const urlPreviewPayload = this.jsonSourcesParser.getUrlPreviewPayload(this.message);
    this.isUrlPreviewMessage = !!urlPreviewPayload;
    if (urlPreviewPayload) {
      this.jsonSourcesDisplayFields = urlPreviewPayload.displayFields;
      this.jsonSourcesBackgroundColor = urlPreviewPayload.previewBackgroundColor;
      this.loadJsonSourcesFromUrlPreviewMessage();
    }
  }

  trackWord(_index: number, item: { word: string; index: number }): number {
    return item.index;
  }

  private async loadJsonSourcesFromUrlPreviewMessage(): Promise<void> {
    // Protect the UI from out-of-order async responses when the input `message` changes quickly.
    const reqId = ++this.urlPreviewReqId;
    // 1) Parse-only, so the UI can render immediately (no url-preview calls).
    const baseSources = this.jsonSourcesParser.parseBaseFromMessage(this.message);
    this.jsonSources = baseSources;

    // 2) Enrich in background via url-preview, then merge missing fields.
    const enriched = await this.jsonSourcesParser.enrichSources(baseSources);
    if (reqId !== this.urlPreviewReqId) return;
    this.jsonSources = enriched;
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
}
