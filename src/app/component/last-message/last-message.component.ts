import { style } from '@angular/animations';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageModel } from './../../../chat21-core/models/message';
import { EventsService } from './../../providers/events.service';
// services
import { Globals } from 'src/app/utils/globals';

// utils

import { MIN_WIDTH_IMAGES } from 'src/app/utils/constants';
import { ConversationModel } from 'src/chat21-core/models/conversation';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { commandToMessage, conversationToMessage, isEmojii, isFrame, isImage, isSameSender } from 'src/chat21-core/utils/utils-message';


@Component({
  selector: 'chat-last-message',
  templateUrl: './last-message.component.html',
  styleUrls: ['./last-message.component.scss']
})
export class LastMessageComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChildren("message_wrp") messageListWRP: QueryList<ElementRef>;

  @Input() conversation: ConversationModel
  @Input() baseLocation: string;
  @Input() stylesMap: Map<string, string>;
  @Output() onCloseMessagePreview  = new EventEmitter();
  @Output() onSelectedConversation = new EventEmitter<string>();
  // ========= begin:: sottoscrizioni ======= //
  subscriptions: Subscription[] = []; /** */
  // ========= end:: sottoscrizioni ======= //

  isEmojii = isEmojii;
  isImage = isImage;
  isFrame = isFrame;

  private logger: LoggerService = LoggerInstance.getInstance();
  public fileSelected: any;
  public messages: MessageModel[] = [];
  
  constructor(
    private events: EventsService,
    public g: Globals,
    private el: ElementRef
    // public conversationsService: ConversationsService
  ) { }

  ngOnInit() {
  }

  /** */
  ngAfterViewInit() {
    // this.logger.debug('isOpenNewMessage: ' + this.g.isOpenNewMessage);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.logger.debug('[LASTMESSAGE] onChanges', changes)
    if(this.conversation){

      if(this.conversation.attributes && this.conversation.attributes.commands){
        this.addCommandMessage(this.conversation)
      }else{
        this.messages.push(conversationToMessage(this.conversation, this.g.senderId))
        this.manageIframeHeight();
      }
      // if(isImage(this.conversation)){
      //   this.fileSelected = Object.assign({}, this.conversation.metadata)
      //   this.fileSelected = Object.assign(this.fileSelected, this.getMetadataSize(this.fileSelected))
      // }
    }
  }

  

  getMetadataSize(metadata): {width, height} {
    const MAX_WIDTH_IMAGES_PREVIEW = 230
    const MAX_HEIGHT_IMAGES_PREIEW = 150
    // if(metadata.width === undefined){
    //   metadata.width= MAX_WIDTH_IMAGES_PREVIEW
    // }
    // if(metadata.height === undefined){
    //   metadata.height = MAX_HEIGHT_IMAGES_PREIEW
    // }
    // const MAX_WIDTH_IMAGES = 300;
    
    const sizeImage = {
        width: metadata.width,
        height: metadata.height
    };

    
    // SCALE IN WIDTH --> for horizontal images
    if (metadata.width && metadata.width > MAX_WIDTH_IMAGES_PREVIEW) {
      const ratio = (metadata['width'] / metadata['height']);
      sizeImage.width = metadata.width = MAX_WIDTH_IMAGES_PREVIEW;
      sizeImage.height = metadata.height = MAX_WIDTH_IMAGES_PREVIEW / ratio;
    } else if(metadata.width && metadata.width <= 55){
      const ratio = (metadata['width'] / metadata['height']);
      sizeImage.width = MIN_WIDTH_IMAGES;
      sizeImage.height = MIN_WIDTH_IMAGES / ratio;
    }

    // SCALE IN HEIGHT --> for vertical images
    if(metadata.height && metadata.height > MAX_HEIGHT_IMAGES_PREIEW){
      const ratio = (MAX_HEIGHT_IMAGES_PREIEW / metadata['width']);
      sizeImage.width = MAX_HEIGHT_IMAGES_PREIEW / ratio;
      sizeImage.height = MAX_HEIGHT_IMAGES_PREIEW ;
    }

    return sizeImage; // h.toString();
  }


  addCommandMessage(conversation: ConversationModel){
    const that = this;
    const commands = conversation.attributes.commands;
    let i=0;
    function execute(command){
      if(command.type === "message"){
        that.messages.push(commandToMessage(command.message,that.conversation, that.g.senderId))
        that.manageIframeHeight()
        i += 1
        if (i < commands.length) {
            execute(commands[i])
        }
        else {
            that.logger.debug('[FIREBASEConversationHandlerSERVICE] addCommandMessage --> last command executed (wait), exit') 
        }
      }else if(command.type === "wait"){
        setTimeout(function() {
          i += 1
          if (i < commands.length) {
              execute(commands[i])
          }
          else {
              that.logger.debug('[FIREBASEConversationHandlerSERVICE] addCommandMessage --> last command executed (send message), exit') 
          }
        },command.time)
      }
    }
    execute(commands[0])
  }





  private manageIframeHeight(retryCount = 0) {
    const maxRetries = 5;
    requestAnimationFrame(() => {
      setTimeout(() => {
        const element = this.messageListWRP.last?.nativeElement;
        if (!element) {
          this.retryIfNeeded(retryCount, maxRetries);
          return;
        }
        const height = this.getElementHeight(element);
        if (height === 0 && retryCount < maxRetries) {
          this.retryIfNeeded(retryCount, maxRetries);
        } else {
          this.g.setWidgetPreviewContainerSize(0, height);
        }
      }, 100);
    });
  }

  private getElementHeight(element: HTMLElement): number {
    // Forza il calcolo dell'altezza
    const originalHeight = element.style.height;
    element.style.height = 'auto';
    let height = element.getBoundingClientRect().height;
    // Prova diverse proprietà di altezza
    if (height === 0) height = element.offsetHeight;
    if (height === 0) height = element.scrollHeight;
    if (height === 0) height = element.clientHeight;
    // Se ancora 0, calcola l'altezza dai figli
    if (height === 0) {
      height = this.calculateHeightFromChildren(element);
    }
    // Ripristina l'altezza originale
    element.style.height = originalHeight;
    return height;
  }

  private calculateHeightFromChildren(element: HTMLElement): number {
    let totalHeight = 0;
    for (let i = 0; i < element.children.length; i++) {
      totalHeight += element.children[i].getBoundingClientRect().height;
    }
    return totalHeight;
  }

  private retryIfNeeded(retryCount: number, maxRetries: number) {
    if (retryCount < maxRetries) {
      setTimeout(() => {
        this.manageIframeHeight(retryCount + 1);
      }, 100 * (retryCount + 1));
    } else {
      console.warn('Element not found after maximum retries');
    }
  }

  isSameSender(senderId: string, index: number){
    return isSameSender(this.messages, senderId, index)
  }




// ========= begin:: event emitter function ============//

  onAttachmentButtonClicked(event: any){
    // this.onAttachmentButtonClicked.emit(event)
    this.logger.debug('[LASTMESSAGE] onAttachmentButtonClicked', event)
    this.openConversationByID(this.conversation);
    setTimeout(() => {
      this.events.publish('lastMessage:attachmentButtonClicked', event)
    }, 500);
  }
  /** */
  openConversationByID(conversation) {
    this.logger.debug('[LASTMESSAGE] openConversationByID: ', conversation);
    this.conversation = null;
    this.g.isOpenNewMessage = false;
    // this.logger.debug('2 isOpenNewMessage: ' + this.g.isOpenNewMessage);
    if ( conversation ) {
      this.onSelectedConversation.emit(conversation);
    }
  }
  /** */
  closeMessagePreview() {
    this.conversation = null;
    this.g.isOpenNewMessage = false;
    // this.logger.debug('3 isOpenNewMessage: ' + this.g.isOpenNewMessage);
    this.onCloseMessagePreview.emit();
  }

  onElementRenderedFN(event){
    this.messageListWRP.forEach((item, index)=> {
      console.log('messageListWRP ---------------------> ', item);
      setTimeout(() => {
        if(this.messageListWRP.get(index)){
          // let height = getComputedStyle(this.messageListWRP.get(index).nativeElement).height
          // this.g.setWidgetPreviewContainerSize(0, +height.substring(0, height.length-2))
          let height = this.messageListWRP.get(this.messages.length-1).nativeElement.offsetHeight
          this.g.setWidgetPreviewContainerSize(0, height)
        }
      }, 50);
    })

  }
  // ========= begin:: event emitter function ============//


  /** */
  ngOnDestroy() {
    this.conversation = null;
    this.g.isOpenNewMessage = false;
    this.messages = []
    // this.logger.debug('4 isOpenNewMessage: ' + this.g.isOpenNewMessage);
    //this.unsubscribe();
  }

  // ========= begin:: DESTROY ALL SUBSCRIPTIONS ============//
  /** */
  unsubscribe() {
    this.subscriptions.forEach(function (subscription) {
        subscription.unsubscribe();
    });
    this.subscriptions = [];
    this.logger.debug('[LASTMESSAGE] this.subscriptions', this.subscriptions);
  }
  // ========= end:: DESTROY ALL SUBSCRIPTIONS ============//

}
