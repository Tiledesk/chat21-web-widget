import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MAX_WIDTH_IMAGES, MSG_STATUS_RETURN_RECEIPT, MSG_STATUS_SENT, MSG_STATUS_SENT_SERVER } from 'src/app/utils/constants';
import { MessageModel } from 'src/chat21-core/models/message';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { UploadService } from 'src/chat21-core/providers/abstract/upload.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { MESSAGE_TYPE_INFO, MESSAGE_TYPE_MINE, MESSAGE_TYPE_OTHERS } from 'src/chat21-core/utils/constants';
import { isCarousel, isEmojii, isFirstMessage, isFrame, isImage, isInfo, isLastMessage, isMine, isSameSender, messageType } from 'src/chat21-core/utils/utils-message';

@Component({
  selector: 'chat-conversation-content',
  templateUrl: './conversation-content.component.html',
  styleUrls: ['./conversation-content.component.scss']
})
export class ConversationContentComponent implements OnInit {
  @ViewChild('scrollMe') public scrollMe: ElementRef;
  
  @Input() messages: MessageModel[]
  @Input() senderId: string;
  @Input() baseLocation: string;
  @Input() isConversationArchived: boolean;
  @Input() isTypings: boolean;
  @Input() idUserTypingNow: string;
  @Input() nameUserTypingNow: string;
  @Input() typingLocation: string;
  @Input() fullscreenMode: boolean;
  @Input() translationMap: Map< string, string>;
  @Input() stylesMap: Map<string, string>;
  @Output() onBeforeMessageRender = new EventEmitter();
  @Output() onAfterMessageRender = new EventEmitter();
  @Output() onMenuOptionShow = new EventEmitter<boolean>();
  @Output() onEmojiiPickerShow = new EventEmitter<boolean>()
  @Output() onAttachmentButtonClicked = new EventEmitter();
  @Output() onScrollContent = new EventEmitter();

  // ========= begin:: gestione scroll view messaggi ======= //
  startScroll = true; // indica lo stato dello scroll: true/false -> è in movimento/ è fermo
  idDivScroll = 'c21-contentScroll'; // id div da scrollare
  isScrolling = false;
  isIE = /msie\s|trident\//i.test(window.navigator.userAgent);
  firstScroll = true;
  // ========= end:: gestione scroll view messaggi ======= //

  // ========= begin:: dichiarazione funzioni ======= //
  isCarousel = isCarousel;
  // ========= end:: dichiarazione funzioni ======= //

  // ========== begin:: set icon status message ======= //
  MSG_STATUS_SENT = MSG_STATUS_SENT;
  MSG_STATUS_SENT_SERVER = MSG_STATUS_SENT_SERVER;
  MSG_STATUS_RETURN_RECEIPT = MSG_STATUS_RETURN_RECEIPT;
  // ========== end:: icon status message ======= //


  // ========== begin:: check message type functions ======= //
  isMine = isMine;
  isInfo = isInfo;
  messageType = messageType;
  isEmojii = isEmojii;
  isImage = isImage;
  isFrame = isFrame;

  MESSAGE_TYPE_INFO = MESSAGE_TYPE_INFO;
  MESSAGE_TYPE_MINE = MESSAGE_TYPE_MINE;
  MESSAGE_TYPE_OTHERS = MESSAGE_TYPE_OTHERS;
  // ========== end:: check message type functions ======= //

  urlBOTImage = 'https://s3.eu-west-1.amazonaws.com/tiledesk-widget/dev/2.0.4-beta.7/assets/images/avatar_bot_tiledesk.svg'
  uploadProgress: number;
  showUploadProgress: boolean = false;
  fileType: string;
  private logger: LoggerService = LoggerInstance.getInstance();

  constructor(private cdref: ChangeDetectorRef,
              private elementRef: ElementRef,
              private uploadService: UploadService) { }

  ngOnInit() {
    this.listenToUploadFileProgress();
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges){
    //decomment if element should have same color of themeColor and fregroundColor
    if(this.stylesMap && this.stylesMap.get('bubbleSentTextColor')) this.elementRef.nativeElement.querySelector('.c21-body').style.setProperty('--textColorSent', this.stylesMap.get('bubbleSentTextColor'));
    if(this.stylesMap && this.stylesMap.get('bubbleReceivedTextColor')) this.elementRef.nativeElement.querySelector('.c21-body').style.setProperty('--textColorReceive', this.stylesMap.get('bubbleReceivedTextColor'));

  }


  /**
   *
   * @param message
   */
  getMetadataSize(metadata): any {
    if(metadata.width === undefined){
      metadata.width= '100%'
    }
    if(metadata.height === undefined){
      metadata.height = MAX_WIDTH_IMAGES
    }
    // const MAX_WIDTH_IMAGES = 300;
    const sizeImage = {
        width: metadata.width,
        height: metadata.height
    };
    //   that.g.wdLog(['message::: ', metadata);
    if (metadata.width && metadata.width > MAX_WIDTH_IMAGES) {
        const rapporto = (metadata['width'] / metadata['height']);
        sizeImage.width = MAX_WIDTH_IMAGES;
        sizeImage.height = MAX_WIDTH_IMAGES / rapporto;
    }
    return sizeImage;
  }


  // ENABLE HTML SECTION 'FILE PENDING UPLOAD'
  listenToUploadFileProgress() {
    this.uploadService.BSStateUpload.subscribe((data: any) => {
      this.logger.debug('[CONV-CONTENT] BSStateUpload', data);
      // && data.type.startsWith("application")
      if (data) { 
          data.upload === 100 || isNaN(data.upload)? this.showUploadProgress = false : this.showUploadProgress = true
          this.uploadProgress = data.upload
          this.fileType = 'file'
          this.scrollToBottom()
        }
    });
  }


  // ========= begin:: functions scroll position ======= //
 
  // LISTEN TO SCROLL POSITION
  onScroll(event): void {
    this.startScroll = false;
    if (this.scrollMe) {
      const divScrollMe = this.scrollMe.nativeElement;
      const checkContentScrollPositionIsEnd = this.checkContentScrollPosition(divScrollMe);
      if (checkContentScrollPositionIsEnd) {
        this.onScrollContent.emit(true)
        //this.showBadgeScroollToBottom = false;
        //this.NUM_BADGES = 0;
      } else {
        this.onScrollContent.emit(false)
        //this.showBadgeScroollToBottom = true;
      }
    }
  }

  /**
   *
   */
  checkContentScrollPosition(divScrollMe?): boolean {
    if(!divScrollMe){
      divScrollMe = this.scrollMe.nativeElement
    }
    if (divScrollMe.scrollHeight - divScrollMe.scrollTop <= (divScrollMe.clientHeight + 40)) {
      this.logger.debug('[CONV-CONTENT] - SONO ALLA FINE');
      return true;
    } else {
      this.logger.debug('[CONV-CONTENT] - NON SONO ALLA FINE');
      return false;
    }
  }

  /**
   * scrollo la lista messaggi all'ultimo
   * chiamato in maniera ricorsiva sino a quando non risponde correttamente
  */

 scrollToBottom(withoutAnimation?: boolean) {
  const that = this;
  try {
    that.isScrolling = true;
    const objDiv = document.getElementById(that.idDivScroll) as HTMLElement;
    setTimeout(function () {

      if (that.isIE === true || withoutAnimation === true || that.firstScroll === true) {
        objDiv.parentElement.classList.add('withoutAnimation');
      } else {
        objDiv.parentElement.classList.remove('withoutAnimation');
      }
      objDiv.parentElement.scrollTop = objDiv.scrollHeight;
      objDiv.style.opacity = '1';
      that.firstScroll = false;
    }, 0);
  } catch (err) {
    this.logger.error('[CONV-CONTENT] scrollToBottom > Error :' + err);
  }
  that.isScrolling = false;
 }

  // ========= END:: functions scroll position ======= //
  isLastMessage(idMessage: string):boolean {
    return isLastMessage(this.messages, idMessage)
    // if (idMessage === this.messages[this.messages.length - 1].uid) {
    //   return true;
    // }
    // return false;
  }

  isSameSender(senderId, index):boolean{
    return isSameSender(this.messages, senderId, index)
    // if(senderId && this.messages[index - 1] && (senderId === this.messages[index - 1].sender)){
    //   return true;
    // }
    // return false;
  }


  isFirstMessage(senderId, index):boolean{
    return isFirstMessage(this.messages, senderId, index)
    // if(senderId && index == 0 && this.messages[index] && (this.messages[index] !== senderId)){
    //   return true;
    // }
    // return false;
  }


  hideOutsideElements(){
    this.onMenuOptionShow.emit(false)
    this.onEmojiiPickerShow.emit(false)
  }


  // ========= begin:: event emitter function ============//

  onAttachmentButtonClickedFN(event: any){
    this.onAttachmentButtonClicked.emit(event)
  }

  onBeforeMessageRenderFN(event){
    //decommentare se in html c'è solamente component tiledesk-text
    //const messageOBJ = { message: this.message, sanitizer: this.sanitizer, messageEl: event.messageEl, component: event.component}
    this.onBeforeMessageRender.emit(event)
  }

  onAfterMessageRenderFN(event){
    this.onAfterMessageRender.emit(event)
  }

  onElementRenderedFN(event){
    const elementRendered = event;
    if (elementRendered.status && this.scrollMe) {
      const divScrollMe = this.scrollMe.nativeElement;
      const checkContentScrollPosition = this.checkContentScrollPosition(divScrollMe);
      this.scrollToBottom() // SCROLLO SEMPRE
      // if (!checkContentScrollPosition) { // SE NON SONO ALLA FINE, SCROLLO CONTENT
      // }
 
    }
  }

  // printMessage(message, messageEl, component) {
  //   const messageOBJ = { message: message, sanitizer: this.sanitizer, messageEl: messageEl, component: component}
  //   this.onBeforeMessageRender.emit(messageOBJ)
  //   const messageText = message.text;
  //   this.onAfterMessageRender.emit(messageOBJ)
  //   // this.triggerBeforeMessageRender(message, messageEl, component);
  //   // const messageText = message.text;
  //   // this.triggerAfterMessageRender(message, messageEl, component);
  //   return messageText;
  // }

  // ========= END:: event emitter function ============//

}
