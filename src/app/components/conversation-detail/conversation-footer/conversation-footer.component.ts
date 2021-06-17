import { ConversationModel } from './../../../../models/conversation';
import { ChatManager } from './../../../../chat21-core/providers/chat-manager';
import { ConversationHandlerService } from '../../../../chat21-core/providers/abstract/conversation-handler.service';
import { MessagingService } from './../../../providers/messaging.service';
import { TypingService } from '../../../../chat21-core/providers/abstract/typing.service';
import { TYPE_MSG_TEXT, TYPE_MSG_IMAGE, TYPE_MSG_FILE } from './../../../../chat21-core/utils/constants';
import { Globals } from './../../../utils/globals';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChange, SimpleChanges, OnChanges, ViewChild } from '@angular/core';
import { UploadModel } from '../../../../chat21-core/models/upload';
import { convertColorToRGBA, htmlEntities, replaceBr, replaceEndOfLine } from '../../../../chat21-core/utils/utils';
import { FileDetector } from 'protractor';
import { UploadService } from '../../../../chat21-core/providers/abstract/upload.service';

@Component({
  selector: 'chat-conversation-footer',
  templateUrl: './conversation-footer.component.html',
  styleUrls: ['./conversation-footer.component.scss']
})
export class ConversationFooterComponent implements OnInit, OnChanges {

  @Input() conversationWith: string;
  @Input() attributes: string;
  @Input() senderId: string;
  @Input() tenant: string;
  @Input() projectid: string;
  @Input() channelType: string;
  @Input() userFullname: string;
  @Input() userEmail: string;
  @Input() widgetTitle: string;
  @Input() showAttachmentButton: boolean;
  // @Input() showWidgetNameInConversation: boolean
  @Input() isConversationArchived: boolean;
  @Input() hideTextReply: boolean;
  @Input() stylesMap: Map<string, string>
  @Input() translationMap: Map< string, string>;
  @Output() onBeforeMessageSent = new EventEmitter();
  @Output() onAfterSendMessage = new EventEmitter();

  @ViewChild('chat21_file') public chat21_file: ElementRef;

  // ========= begin:: send image ======= //
  selectedFiles: FileList;
  isFilePendingToUpload: Boolean = false;
  arrayFilesLoad: Array<any> = [];
  isFileSelected: Boolean = false;
  HEIGHT_DEFAULT = '20px';
  // ========= end:: send image ========= //

  isNewConversation = true;
  textInputTextArea: string;
  conversationHandlerService: ConversationHandlerService

  convertColorToRGBA = convertColorToRGBA;
  constructor(public g: Globals,
              //public upSvc: UploadService,
              private chatManager: ChatManager,
              private typingService: TypingService,
              private uploadService: UploadService) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges){
    console.log('ConversationFooterComponent::changessss', changes)
    if(changes['conversationWith'] && changes['conversationWith'].currentValue !== undefined){
      this.conversationHandlerService = this.chatManager.getConversationHandlerByConversationId(this.conversationWith);
    }
    // if(changes['senderId'] && changes['tenant'] && (changes['senderId'].currentValue !== undefined) && (changes['tenant'].currentValue !== undefined)){
    //   this.upSvc.initialize(this.senderId, this.tenant, this.conversationWith);
    // }
  }
  
  ngAfterViewInit() {
    this.g.wdLog([' --------ngAfterViewInit: conversation-footer-------- ']); 
  }

  // ========= begin:: functions send image ======= //
  // START LOAD IMAGE //
  /**
   * carico in locale l'immagine selezionata e apro pop up anteprima
   */
  detectFiles(event) {
    this.g.wdLog(['detectFiles: ', event]);

    if (event) {
        this.selectedFiles = event.target.files;
        this.g.wdLog(['AppComponent:detectFiles::selectedFiles', this.selectedFiles]);
        if (this.selectedFiles == null) {
          this.isFilePendingToUpload = false;
        } else {
          this.isFilePendingToUpload = true;
        }
        this.g.wdLog(['AppComponent:detectFiles::selectedFiles::isFilePendingToUpload', this.isFilePendingToUpload]);
        this.g.wdLog(['fileChange: ', event.target.files]);
        if (event.target.files.length <= 0) {
          this.isFilePendingToUpload = false;
        } else {
          this.isFilePendingToUpload = true;
        }
        
        const that = this;
        if (event.target.files && event.target.files[0]) {
            const nameFile = event.target.files[0].name;
            const typeFile = event.target.files[0].type;
            const reader = new FileReader();
              that.g.wdLog(['OK preload: ', nameFile, typeFile, reader]);
              reader.addEventListener('load', function () {
                that.g.wdLog(['addEventListener load', reader.result]);
                that.isFileSelected = true;
                // se inizia con image
                if (typeFile.startsWith('image') && !typeFile.includes('svg')) {
                  const imageXLoad = new Image;
                  that.g.wdLog(['onload ', imageXLoad]);
                  imageXLoad.src = reader.result.toString();
                  imageXLoad.title = nameFile;
                  imageXLoad.onload = function () {
                    that.g.wdLog(['onload immagine']);
                    // that.arrayFilesLoad.push(imageXLoad);
                    const uid = (new Date().getTime()).toString(36); // imageXLoad.src.substring(imageXLoad.src.length - 16);
                    that.arrayFilesLoad[0] = { uid: uid, file: imageXLoad, type: typeFile };
                    that.g.wdLog(['OK: ', that.arrayFilesLoad[0]]);
                    // INVIO MESSAGGIO
                    that.loadFile();
                  };
                } else {
                  that.g.wdLog(['onload file']);
                  const fileXLoad = {
                    src: reader.result.toString(),
                    title: nameFile
                  };
                  // that.arrayFilesLoad.push(imageXLoad);
                  const uid = (new Date().getTime()).toString(36); // imageXLoad.src.substring(imageXLoad.src.length - 16);
                  that.arrayFilesLoad[0] = { uid: uid, file: fileXLoad, type: typeFile };
                  that.g.wdLog(['OK: ', that.arrayFilesLoad[0]]);
                  // INVIO MESSAGGIO
                  that.loadFile();
                }
              }, false);

              if (event.target.files[0]) {
                reader.readAsDataURL(event.target.files[0]);
                  that.g.wdLog(['reader-result: ', event.target.files[0]]);
              }
        }
    }
  }


  loadFile() {
    this.g.wdLog(['that.fileXLoad: ', this.arrayFilesLoad]);
        // al momento gestisco solo il caricamento di un'immagine alla volta
        if (this.arrayFilesLoad[0] && this.arrayFilesLoad[0].file) {
            const fileXLoad = this.arrayFilesLoad[0].file;
            const uid = this.arrayFilesLoad[0].uid;
            const type = this.arrayFilesLoad[0].type;
            this.g.wdLog(['that.fileXLoad: ', type]);
            let metadata;
            if (type.startsWith('image') && !type.includes('svg')) {
                metadata = {
                    'name': fileXLoad.title,
                    'src': fileXLoad.src,
                    'width': fileXLoad.width,
                    'height': fileXLoad.height,
                    'type': type,
                    'uid': uid
                };
            } else {
                metadata = {
                    'name': fileXLoad.title,
                    'src': fileXLoad.src,
                    'type': type,
                    'uid': uid
                };
            }
            this.g.wdLog(['metadata -------> ', metadata]);
            // this.scrollToBottom();
            // 1 - aggiungo messaggio localmente
            // this.addLocalMessageImage(metadata);
            // 2 - carico immagine
            const file = this.selectedFiles.item(0);
            this.uploadSingle(metadata, file);
            // this.isSelected = false;
        }
    }


  /**
   *
   */
    uploadSingle(metadata, file) {
        const that = this;
        const send_order_btn = <HTMLInputElement>document.getElementById('chat21-start-upload-doc');
        send_order_btn.disabled = true;
        that.g.wdLog(['AppComponent::uploadSingle::', metadata, file]);
        // const file = this.selectedFiles.item(0);
        const currentUpload = new UploadModel(file);
        // console.log(currentUpload.file);

        // const uploadTask = this.upSvc.pushUpload(currentUpload);
        // uploadTask.then(snapshot => {
        //     return snapshot.ref.getDownloadURL();   // Will return a promise with the download link
        // }).then(downloadURL => {
        //     that.g.wdLog(['AppComponent::uploadSingle:: downloadURL', downloadURL]);
        //     that.g.wdLog([`Successfully uploaded file and got download link - ${downloadURL}`]);

        //     metadata.src = downloadURL;
        //     let type_message = TYPE_MSG_TEXT;
        //     let message = 'File: ' + metadata.src;
        //     if (metadata.type.startsWith('image')) {
        //         type_message = TYPE_MSG_IMAGE;
        //         message = ''; // 'Image: ' + metadata.src;
        //     }
        //     that.sendMessage(message, type_message, metadata);
        //     that.isFilePendingToUpload = false;
        //     // return downloadURL;
        // }).catch(error => {
        //   // Use to signal error if something goes wrong.
        //   console.error(`AppComponent::uploadSingle:: Failed to upload file and get link - ${error}`);
        // });
      // this.resetLoadImage();
      

        this.uploadService.upload(currentUpload).then(downloadURL => {
          that.g.wdLog(['AppComponent::uploadSingle:: downloadURL', downloadURL]);
          that.g.wdLog([`Successfully uploaded file and got download link - ${downloadURL}`]);

          metadata.src = downloadURL;
          let type_message = TYPE_MSG_TEXT;
          // let message = 'File: ' + metadata.src;
          let message = `[${metadata.name}](${metadata.src})`
          if (metadata.type.startsWith('image') && !metadata.type.includes('svg')) {
              type_message = TYPE_MSG_IMAGE;
              message = ''; // 'Image: ' + metadata.src;
          }
          that.sendMessage(message, type_message, metadata);
          that.chat21_file.nativeElement.value = '';
          that.isFilePendingToUpload = false;
          // return downloadURL;
        }).catch(error => {
          // Use to signal error if something goes wrong.
          console.error(`AppComponent::uploadSingle:: Failed to upload file and get link - ${error}`);
          that.isFilePendingToUpload = false;
        });
        that.g.wdLog(['reader-result: ', file]);
    }

  /**
   * invio del messaggio
   * @param msg
   * @param type
   * @param metadata
   * @param additional_attributes
   */
  sendMessage(msg, type, metadata?, additional_attributes?) { // sponziello
    (metadata) ? metadata = metadata : metadata = '';
    this.g.wdLog(['SEND MESSAGE: ', msg, type, metadata, additional_attributes]);
    if (msg && msg.trim() !== '' || type === TYPE_MSG_IMAGE || type === TYPE_MSG_FILE ) {

      msg = htmlEntities(msg);
      msg = replaceEndOfLine(msg);
      msg = msg.trim();

        let recipientFullname = this.translationMap.get('GUEST_LABEL');
          // sponziello: adds ADDITIONAL ATTRIBUTES TO THE MESSAGE
        const g_attributes = this.attributes;
        // added <any> to resolve the Error occurred during the npm installation: Property 'userFullname' does not exist on type '{}'
        const attributes = <any>{};
        if (g_attributes) {
          for (const [key, value] of Object.entries(g_attributes)) {
            attributes[key] = value;
          }
        }
        if (additional_attributes) {
          for (const [key, value] of Object.entries(additional_attributes)) {
            attributes[key] = value;
          }
        }
          // fine-sponziello
        // console.log('this.conversationswith', this.conversationWith)
        // this.conversationHandlerService = this.chatManager.getConversationHandlerByConversationId(this.conversationWith)
        const senderId = this.senderId;
        const projectid = this.projectid;
        const channelType = this.channelType;
        const userFullname = this.userFullname;
        const userEmail = this.userEmail;
        // const showWidgetNameInConversation = this.showWidgetNameInConversation;
        const widgetTitle = this.widgetTitle;
        const conversationWith = this.conversationWith;
        this.onBeforeMessageSent.emit({
          senderFullname: recipientFullname,
          text: msg,
          type: type,
          metadata: metadata,
          conversationWith: conversationWith,
          recipientFullname: recipientFullname,
          attributes : attributes,
          projectid: projectid,
          channelType: channelType
        })
        // this.triggerBeforeSendMessageEvent(
        //   recipientFullname,
        //   msg,
        //   type,
        //   metadata,
        //   conversationWith,
        //   recipientFullname,
        //   attributes,
        //   projectid,
        //   channelType
        // );
        if (userFullname) {
          recipientFullname = userFullname;
        } else if (userEmail) {
          recipientFullname = userEmail;
        } else if (attributes && attributes['userFullname']) {
          recipientFullname = attributes['userFullname'];
        } else {
          recipientFullname = this.translationMap.get('GUEST_LABEL');
        }
        // if (showWidgetNameInConversation && showWidgetNameInConversation === true) {
        //   recipientFullname += ' - ' + widgetTitle;
        // }
        const messageSent = this.conversationHandlerService.sendMessage(
          msg,
          type,
          metadata,
          conversationWith,
          recipientFullname,
          senderId,
          recipientFullname,
          channelType ,    
          attributes
        );

        // this.triggerAfterSendMessageEvent(messageSent);
        this.onAfterSendMessage.emit(messageSent)
        this.isNewConversation = false;

        //TODO-GAB: da rivedere
        try {
          const target = document.getElementById('chat21-main-message-context') as HTMLInputElement;
          target.value = '';
          target.style.height = this.HEIGHT_DEFAULT;
          // console.log('target.style.height: ', target.style.height);
        } catch (e) {
          this.g.wdLog(['> Error :' + e]);
        }
        this.restoreTextArea();
    }
  }

  //MOVED TO TRIGGERHANDLER
  // private triggerBeforeSendMessageEvent(senderFullname, text, type, metadata, conversationWith, recipientFullname, attributes, projectid, channel_type) {
  //   try {
  //       // tslint:disable-next-line:max-line-length
  //       const onBeforeMessageSend = new CustomEvent('onBeforeMessageSend', { detail: { senderFullname: senderFullname, text: text, type: type, metadata, conversationWith: conversationWith, recipientFullname: recipientFullname, attributes: attributes, projectid: projectid, channelType: channel_type } });
  //       const windowContext = this.g.windowContext;
  //       if (windowContext.tiledesk && windowContext.tiledesk.tiledeskroot) {
  //           windowContext.tiledesk.tiledeskroot.dispatchEvent(onBeforeMessageSend);
  //           this.g.windowContext = windowContext;
  //       } else {
  //         this.el.nativeElement.dispatchEvent(onBeforeMessageSend);
  //       }
  //   } catch (e) {
  //     this.g.wdLog(['> Error :' + e]);
  //   }
  // }

  //MOVED TO TRIGGERHANDLER
  // private triggerAfterSendMessageEvent(message) {
  //   try {
  //       // tslint:disable-next-line:max-line-length
  //       const onAfterMessageSend = new CustomEvent('onAfterMessageSend', { detail: { message: message } });
  //       const windowContext = this.g.windowContext;
  //       if (windowContext.tiledesk && windowContext.tiledesk.tiledeskroot) {
  //           windowContext.tiledesk.tiledeskroot.dispatchEvent(onAfterMessageSend);
  //           this.g.windowContext = windowContext;
  //       } else {
  //         this.el.nativeElement.dispatchEvent(onAfterMessageSend);
  //       }
  //   } catch (e) {
  //     this.g.wdLog(['> Error :' + e]);
  //   }
  // }


  private restoreTextArea() {
    //   that.g.wdLog(['AppComponent:restoreTextArea::restoreTextArea');
    this.resizeInputField();
    const textArea = (<HTMLInputElement>document.getElementById('chat21-main-message-context'));
    this.textInputTextArea = ''; // clear the textarea
    if (textArea) {
        textArea.value = '';  // clear the textarea
        textArea.placeholder = this.translationMap.get('LABEL_PLACEHOLDER');  // restore the placholder
        this.g.wdLog(['AppComponent:restoreTextArea::restoreTextArea::textArea:', 'restored']);
    } else {
          console.error('AppComponent:restoreTextArea::restoreTextArea::textArea:', 'not restored');
    }
    this.setFocusOnId('chat21-main-message-context');
  }

  /**
   * ridimensiona la textarea
   * chiamato ogni volta che cambia il contenuto della textarea
   * imposto stato 'typing'
   */
  resizeInputField() {
    try {
      const target = document.getElementById('chat21-main-message-context') as HTMLInputElement;
      // tslint:disable-next-line:max-line-length
      //   that.g.wdLog(['H:: this.textInputTextArea', (document.getElementById('chat21-main-message-context') as HTMLInputElement).value , target.style.height, target.scrollHeight, target.offsetHeight, target.clientHeight);
      target.style.height = '100%';
      if (target.value === '\n') {
          target.value = '';
          target.style.height = this.HEIGHT_DEFAULT;
      } else if (target.scrollHeight > target.offsetHeight) {
          target.style.height = target.scrollHeight + 2 + 'px';
          target.style.minHeight = this.HEIGHT_DEFAULT;
      } else {
          //   that.g.wdLog(['PASSO 3');
          target.style.height = this.HEIGHT_DEFAULT;
          // segno sto scrivendo
          // target.offsetHeight - 15 + 'px';
      }
      //this.setWritingMessages(target.value);
    } catch (e) {
      this.g.wdLog(['> Error :' + e]);
    }
    // tslint:disable-next-line:max-line-length
    //   that.g.wdLog(['H:: this.textInputTextArea', this.textInputTextArea, target.style.height, target.scrollHeight, target.offsetHeight, target.clientHeight);
  }

  onTextAreaChange(){
    this.resizeInputField()
    this.setWritingMessages(this.textInputTextArea)
  }

  onSendPressed(event) {
    this.g.wdLog(['onSendPressed:event', event]);
    this.g.wdLog(['AppComponent::onSendPressed::isFilePendingToUpload:', this.isFilePendingToUpload]);
    if (this.isFilePendingToUpload) {
      this.g.wdLog(['AppComponent::onSendPressed', 'is a file']);
      // its a file
      this.loadFile();
      this.isFilePendingToUpload = false;
      // disabilito pulsanti
      this.g.wdLog(['AppComponent::onSendPressed::isFilePendingToUpload:', this.isFilePendingToUpload]);
    } else {
      if ( this.textInputTextArea.length > 0 ) {
        this.g.wdLog(['AppComponent::onSendPressed', 'is a message']);
        // its a message
        if (this.textInputTextArea && this.textInputTextArea.trim() !== '') {
          //   that.g.wdLog(['sendMessage -> ', this.textInputTextArea);
          // this.resizeInputField();
          // this.messagingService.sendMessage(msg, TYPE_MSG_TEXT);
          // this.setDepartment();
          // this.textInputTextArea = replaceBr(this.textInputTextArea);
          this.sendMessage(this.textInputTextArea, TYPE_MSG_TEXT);
          // this.restoreTextArea();
        }
        // restore the text area
        // this.restoreTextArea();
      }
    }
  }





  setFocusOnId(id) {
    setTimeout(function () {
        const textarea = document.getElementById(id);
        if (textarea) {
            //   that.g.wdLog(['1--------> FOCUSSSSSS : ', textarea);
            textarea.setAttribute('value', ' ');
            textarea.focus();
        }
    }, 500);
  }

  /**
   *
   * @param str
   */
  setWritingMessages(str) {
    //this.messagingService.setWritingMessages(str, this.g.channelType);
    this.typingService.setTyping(this.conversationWith, str, this.senderId, this.getUserFUllName() )
  }

  getUserFUllName(): string {
    const userFullName = this.userFullname
    if(userFullName){
      return userFullName
    }else{
      return this.translationMap.get('GUEST_LABEL')
    }
  }

  /**
     * quando premo un tasto richiamo questo metodo che:
     * verifica se è stato premuto 'invio'
     * se si azzera testo
     * imposta altezza campo come min di default
     * leva il focus e lo reimposta dopo pochi attimi
     * (questa è una toppa per mantenere il focus e eliminare il br dell'invio!!!)
     * invio messaggio
     * @param event
     */
    onkeypress(event) {
      const keyCode = event.which || event.keyCode;
      this.textInputTextArea = ((document.getElementById('chat21-main-message-context') as HTMLInputElement).value);
      // this.g.wdLog(['onkeypress **************', this.textInputTextArea]);
      if (keyCode === 13) {
        if (this.textInputTextArea && this.textInputTextArea.trim() !== '') {
          //   that.g.wdLog(['sendMessage -> ', this.textInputTextArea);
          // this.resizeInputField();
          // this.messagingService.sendMessage(msg, TYPE_MSG_TEXT);
          // this.setDepartment();
          // this.textInputTextArea = replaceBr(this.textInputTextArea);
          this.sendMessage(this.textInputTextArea, TYPE_MSG_TEXT);
          // this.restoreTextArea();
        }
      } else if (keyCode === 9) {
        event.preventDefault();
      }
  }

}