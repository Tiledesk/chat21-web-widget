import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MessageModel } from 'src/chat21-core/models/message';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { MAX_WIDTH_IMAGES, MESSAGE_TYPE_MINE, MESSAGE_TYPE_OTHERS, MIN_WIDTH_IMAGES } from 'src/chat21-core/utils/constants';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';
import { isAudio, isAudioTTS, isFile, isFrame, isImage, messageType } from 'src/chat21-core/utils/utils-message';
import { getColorBck } from 'src/chat21-core/utils/utils-user';

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
  @Output() onElementRendered = new EventEmitter<{element: string, status: boolean}>();
  isImage = isImage;
  isFile = isFile;
  isFrame = isFrame;
  isAudio = isAudio;
  isAudioTTS=isAudioTTS;
  convertColorToRGBA = convertColorToRGBA

 // ========== begin:: check message type functions ======= //
  messageType = messageType;

  MESSAGE_TYPE_MINE = MESSAGE_TYPE_MINE;
  MESSAGE_TYPE_OTHERS = MESSAGE_TYPE_OTHERS;
 // ========== end:: check message type functions ======= //
  sizeImage : { width: number, height: number}
  fullnameColor: string;
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
  }

  trackWord(_index: number, item: { word: string; index: number }): number {
    return item.index;
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
