import { Component, ComponentFactoryResolver, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { Globals } from 'src/app/utils/globals';
import { checkAcceptedFile } from 'src/app/utils/utils';
import { MessageModel } from 'src/chat21-core/models/message';
import { UploadModel } from 'src/chat21-core/models/upload';
import { ConversationHandlerService } from 'src/chat21-core/providers/abstract/conversation-handler.service';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { TypingService } from 'src/chat21-core/providers/abstract/typing.service';
import { UploadService } from 'src/chat21-core/providers/abstract/upload.service';
import { ChatManager } from 'src/chat21-core/providers/chat-manager';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { TYPE_MSG_FILE, TYPE_MSG_IMAGE, TYPE_MSG_TEXT } from 'src/chat21-core/utils/constants';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';

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
  @Input() showAttachmentButton: boolean;
  // @Input() showContinueConversationButton: boolean;
  @Input() isConversationArchived: boolean;
  @Input() hideTextAreaContent: boolean;
  @Input() hideTextReply: boolean;
  @Input() isMobile: boolean;
  @Input() isEmojiiPickerShow: boolean;
  @Input() footerMessagePlaceholder: string;
  @Input() fileUploadAccept: string;
  @Input() dropEvent: Event;
  @Input() poweredBy: string;
  @Input() stylesMap: Map<string, string>
  @Input() translationMap: Map< string, string>;
  @Output() onEmojiiPickerShow = new EventEmitter<boolean>();
  @Output() onBeforeMessageSent = new EventEmitter();
  @Output() onAfterSendMessage = new EventEmitter<MessageModel>();
  @Output() onChangeTextArea = new EventEmitter<any>();
  @Output() onAttachmentFileButtonClicked = new EventEmitter<any>();
  @Output() onNewConversationButtonClicked = new EventEmitter();
  @Output() onBackButton = new EventEmitter()

  @ViewChild('chat21_file') public chat21_file: ElementRef;
  // @ViewChild('emojii_container', {read: ViewContainerRef}) selector;
  @ViewChild('emoji_mart_container', {read: ViewContainerRef}) public divEmojiiContainer: ViewContainerRef;
  // ========= begin:: send image ======= //
  selectedFiles: FileList;
  isFilePendingToUpload: Boolean = false;
  arrayFilesLoad: Array<any> = [];
  isFileSelected: Boolean = false;
  HEIGHT_DEFAULT = '20px';
  // ========= end:: send image ========= //

  // isNewConversation = true;
  textInputTextArea: string;
  conversationHandlerService: ConversationHandlerService

  showEmojiPicker: boolean = false; //To show/hide emoji picker
  loadPickerModule: boolean = true;
  emojiiOptions = {
    emojiPerLine : 9,
    totalFrequentLines: 1,
    showPreview: false,
    darkMode: false,
    enableSearch: false,
    include: [ 'recent', 'people', 'nature', 'activity', 'flags']
  }

  convertColorToRGBA = convertColorToRGBA;
  private logger: LoggerService = LoggerInstance.getInstance()
  constructor(public g: Globals,
              private chatManager: ChatManager,
              private typingService: TypingService,
              private uploadService: UploadService) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges){
    if(changes['conversationWith'] && changes['conversationWith'].currentValue !== undefined){
      this.conversationHandlerService = this.chatManager.getConversationHandlerByConversationId(this.conversationWith);
    }
    if(changes['hideTextReply'] && changes['hideTextReply'].currentValue !== undefined){
      this.restoreTextArea();
    }

    if(changes['dropEvent'] && changes['dropEvent'].currentValue !== undefined){
      this.onDrop(this.dropEvent)
    }

  }
  
  ngAfterViewInit() {
    this.logger.debug('[CONV-FOOTER] --------ngAfterViewInit: conversation-footer-------- '); 
    // setTimeout(() => {
      this.showEmojiPicker = true
    // }, 500);
  }

  // ========= begin:: functions send image ======= //
  // START LOAD IMAGE //
  /** load the selected image locally and open the pop up preview */
  detectFiles(event) {
    this.logger.debug('[CONV-FOOTER] detectFiles: ', event);

    if (event) {
        this.selectedFiles = event.target.files;
        this.logger.debug('[CONV-FOOTER] AppComponent:detectFiles::selectedFiles', this.selectedFiles);
        // this.onAttachmentButtonClicked.emit(this.selectedFiles)
        if (this.selectedFiles == null) {
          this.isFilePendingToUpload = false;
        } else {
          this.isFilePendingToUpload = true;
        }
        this.logger.debug('[CONV-FOOTER] AppComponent:detectFiles::selectedFiles::isFilePendingToUpload', this.isFilePendingToUpload);
        this.logger.debug('[CONV-FOOTER] fileChange: ', event.target.files);
        if (event.target.files.length <= 0) {
          this.isFilePendingToUpload = false;
        } else {
          this.isFilePendingToUpload = true;
        }
        
        const that = this;
        if (event.target.files && event.target.files[0]) {

          const canUploadFile = checkAcceptedFile(event.target.files[0].type, this.fileUploadAccept)
          if(!canUploadFile){
            this.logger.error('[IMAGE-UPLOAD] detectFiles: can not upload current file type--> NOT ALLOWED', this.fileUploadAccept)
            this.isFilePendingToUpload = false;
            return;
          }

          const nameFile = event.target.files[0].name;
          const typeFile = event.target.files[0].type;
          const size = event.target.files[0].size
          const reader = new FileReader();
            that.logger.debug('[CONV-FOOTER] OK preload: ', nameFile, typeFile, reader);
            reader.addEventListener('load', function () {
              that.logger.debug('[CONV-FOOTER] addEventListener load', reader.result);
              that.isFileSelected = true;
              // se inizia con image
              if (typeFile.startsWith('image') && !typeFile.includes('svg')) {
                const imageXLoad = new Image;
                that.logger.debug('[CONV-FOOTER] onload ', imageXLoad);
                imageXLoad.src = reader.result.toString();
                imageXLoad.title = nameFile;
                imageXLoad.onload = function () {
                  that.logger.debug('[CONV-FOOTER] onload image');
                  // that.arrayFilesLoad.push(imageXLoad);
                  const uid = (new Date().getTime()).toString(36); // imageXLoad.src.substring(imageXLoad.src.length - 16);
                  that.arrayFilesLoad[0] = { uid: uid, file: imageXLoad, type: typeFile, size: size };
                  that.logger.debug('[CONV-FOOTER] OK: ', that.arrayFilesLoad[0]);
                  // SEND MESSAGE
                  that.loadFile();
                };
              } else {
                that.logger.debug('[CONV-FOOTER] onload file');
                const fileXLoad = {
                  src: reader.result.toString(),
                  title: nameFile
                };
                // that.arrayFilesLoad.push(imageXLoad);
                const uid = (new Date().getTime()).toString(36); // imageXLoad.src.substring(imageXLoad.src.length - 16);
                that.arrayFilesLoad[0] = { uid: uid, file: fileXLoad, type: typeFile, size: size };
                that.logger.debug('[CONV-FOOTER] OK: ', that.arrayFilesLoad[0]);
                // SEND MESSAGE
                that.loadFile();
              }
            }, false);

            if (event.target.files[0]) {
              reader.readAsDataURL(event.target.files[0]);
              that.logger.debug('[CONV-FOOTER] reader-result: ', event.target.files[0]);
            }
        }
    }
  }


  loadFile() {
    this.logger.debug('[CONV-FOOTER] that.fileXLoad: ', this.arrayFilesLoad);
        // at the moment I only manage the upload of one image at a time
        if (this.arrayFilesLoad[0] && this.arrayFilesLoad[0].file) {
            const fileXLoad = this.arrayFilesLoad[0].file;
            const uid = this.arrayFilesLoad[0].uid;
            const type = this.arrayFilesLoad[0].type;
            const size = this.arrayFilesLoad[0].size
            this.logger.debug('[CONV-FOOTER] that.fileXLoad: ', type);
            let metadata;
            if (type.startsWith('image') && !type.includes('svg')) {
                metadata = {
                    'name': fileXLoad.title,
                    'src': fileXLoad.src,
                    'width': fileXLoad.width,
                    'height': fileXLoad.height,
                    'type': type,
                    'uid': uid,
                    'size': size
                };
            } else {
                metadata = {
                    'name': fileXLoad.title,
                    'src': fileXLoad.src,
                    'type': type,
                    'uid': uid,
                    'size': size
                };
            }
            this.logger.debug('[CONV-FOOTER] metadata -------> ', metadata);
            // this.scrollToBottom();
            // 1 - aggiungo messaggio localmente
            // this.addLocalMessageImage(metadata);
            // 2 - carico immagine
            const file = this.selectedFiles.item(0);
            this.onAttachmentFileButtonClicked.emit({attachments: [{metadata, file}], message: this.textInputTextArea}) //GABBBBBBBB
            this.restoreTextArea();
            this.chat21_file.nativeElement.value = ''; //BUG-FIXED: allow you to re-load the same previous file
            // this.uploadSingle(metadata, file); 
            // this.isSelected = false;
        }
    }


    uploadSingle(metadata, file, messageText?: string) {
      const that = this;
      const send_order_btn = <HTMLInputElement>document.getElementById('chat21-start-upload-doc');
      send_order_btn.disabled = true;
      that.logger.debug('[CONV-FOOTER] AppComponent::uploadSingle::', metadata, file);
      // const file = this.selectedFiles.item(0);
      const currentUpload = new UploadModel(file);

      // const uploadTask = this.upSvc.pushUpload(currentUpload);
      // uploadTask.then(snapshot => {
      //     return snapshot.ref.getDownloadURL();   // Will return a promise with the download link
      // }).then(downloadURL => {
      //     that.logger.debug('[CONV-FOOTER] AppComponent::uploadSingle:: downloadURL', downloadURL]);
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
      
      this.uploadService.upload(this.senderId, currentUpload).then(data => {
        that.logger.debug('[CONV-FOOTER] AppComponent::uploadSingle:: downloadURL', data);
        that.logger.debug(`[CONV-FOOTER] Successfully uploaded file and got download link - ${data}`);

        metadata.src = data.src;
        metadata.downloadURL = data.downloadURL;
        let type_message = TYPE_MSG_TEXT;
        // let message = 'File: ' + metadata.src;
        let message = `[${metadata.name}](${metadata.src})`
        if (metadata.type.startsWith('image') && !metadata.type.includes('svg')) {
            type_message = TYPE_MSG_IMAGE;
            // message = '';
            message = messageText 
        } else if ((metadata.type.startsWith('image') && metadata.type.includes('svg')) || !metadata.type.startsWith('image')){
            type_message = TYPE_MSG_FILE
            // type_message = metadata.type
            message = message + '\n' + messageText
        } else if (!metadata.type.startsWith('image')){
          type_message = TYPE_MSG_FILE
          // type_message = metadata.type
          message = message + '\n' + messageText
        }
        that.sendMessage(message, type_message, metadata);
        that.chat21_file.nativeElement.value = ''; //BUG-FIXED: allow you to re-load the same previous file
        that.isFilePendingToUpload = false;
        // return downloadURL;
      }).catch(error => {
        // Use to signal error if something goes wrong.
        that.logger.error(`[CONV-FOOTER] uploadSingle:: Failed to upload file and get link - ${error}`);
        that.isFilePendingToUpload = false;
      });
      that.logger.debug('[CONV-FOOTER] reader-result: ', file);
    }

  /**
   * sending message
   * @param msg
   * @param type
   * @param metadata
   * @param additional_attributes
   */
  sendMessage(msg: string, type: string, metadata?: any, additional_attributes?: any) { // sponziello
    (metadata) ? metadata = metadata : metadata = '';
    this.onEmojiiPickerShow.emit(false)
    this.logger.debug('[CONV-FOOTER] SEND MESSAGE: ', msg, type, metadata, additional_attributes);
    if (msg && msg.trim() !== '' || type === TYPE_MSG_IMAGE || type === TYPE_MSG_FILE ) {

      // msg = htmlEntities(msg);
      // msg = replaceEndOfLine(msg);
      // msg = msg.trim();

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
        // this.conversationHandlerService = this.chatManager.getConversationHandlerByConversationId(this.conversationWith)
        const senderId = this.senderId;
        const projectid = this.projectid;
        const channelType = this.channelType;
        const userFullname = this.userFullname;
        const userEmail = this.userEmail;
        const conversationWith = this.conversationWith;
        

        if (userFullname) {
          recipientFullname = userFullname;
        } else if (userEmail) {
          recipientFullname = userEmail;
        } else if (attributes && attributes['userFullname']) {
          recipientFullname = attributes['userFullname'];
        } else {
          recipientFullname = this.translationMap.get('GUEST_LABEL');
        }

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
        
        this.conversationHandlerService = this.chatManager.getConversationHandlerByConversationId(this.conversationWith);
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

        this.onAfterSendMessage.emit(messageSent)
        // this.isNewConversation = false;

        //TODO-GAB: da rivedere
        try {
          const target = document.getElementById('chat21-main-message-context') as HTMLInputElement;
          target.value = '';
          target.style.height = this.HEIGHT_DEFAULT;
        } catch (e) {
          this.logger.error('[CONV-FOOTER] > Error :' + e);
        }
        this.restoreTextArea();
    }
  }

  private restoreTextArea() {
    //   that.logger.debug('[CONV-FOOTER] AppComponent:restoreTextArea::restoreTextArea');
    this.resizeInputField();
    const textArea = (<HTMLInputElement>document.getElementById('chat21-main-message-context'));
    this.textInputTextArea = ''; // clear the textarea
    if (textArea) {
      textArea.value = '';  // clear the textarea
      textArea.placeholder = this.translationMap.get('LABEL_PLACEHOLDER');  // restore the placholder
      if(textArea.style.height > this.HEIGHT_DEFAULT){
        document.getElementById('chat21-button-send').style.removeProperty('right')
      }
      this.logger.debug('[CONV-FOOTER] AppComponent:restoreTextArea::restoreTextArea::textArea:', 'restored');
    }
    this.setFocusOnId('chat21-main-message-context');
  }

  /**
   * resize the textarea
   * called whenever the content of the textarea changes
   * set 'typing' state
   */
  resizeInputField() {
    try {
      const target = document.getElementById('chat21-main-message-context') as HTMLInputElement;
      // tslint:disable-next-line:max-line-length
      //   that.logger.debug('[CONV-FOOTER] H:: this.textInputTextArea', (document.getElementById('chat21-main-message-context') as HTMLInputElement).value , target.style.height, target.scrollHeight, target.offsetHeight, target.clientHeight);
      target? target.style.height = '100%': null;
      if (target && target.value === '\n') {
          target.value = '';
          target.style.height = this.HEIGHT_DEFAULT;
        } else if (target && target.scrollHeight > target.offsetHeight) {
          target.style.height = target.scrollHeight + 2 + 'px';
          target.style.minHeight = this.HEIGHT_DEFAULT;
        } else if (target) {
          target.style.height = this.HEIGHT_DEFAULT;
          // segno sto scrivendo
          // target.offsetHeight - 15 + 'px';
      }
      //this.setWritingMessages(target.value);
      this.onChangeTextArea.emit({textAreaEl: target, minHeightDefault: this.HEIGHT_DEFAULT})
    } catch (e) {
      this.logger.error('[CONV-FOOTER] > Error :' + e);
    }
  }

  onTextAreaChange(){
    this.resizeInputField()
    this.setWritingMessages(this.textInputTextArea)
  }

  onSendPressed(event) {
    this.logger.debug('[CONV-FOOTER] onSendPressed:event', event);
    event.preventDefault();
    this.logger.debug('[CONV-FOOTER] AppComponent::onSendPressed::isFilePendingToUpload:', this.isFilePendingToUpload);
    if (this.isFilePendingToUpload) {
      this.logger.debug('[CONV-FOOTER] AppComponent::onSendPressed', 'is a file');
      // its a file
      this.loadFile();
      this.isFilePendingToUpload = false;
      // disabilito pulsanti
      this.logger.debug('[CONV-FOOTER] AppComponent::onSendPressed::isFilePendingToUpload:', this.isFilePendingToUpload);
    } else {
      if ( this.textInputTextArea && this.textInputTextArea.length > 0 ) {
        this.logger.debug('[CONV-FOOTER] AppComponent::onSendPressed', 'is a message');
        // its a message
        if (this.textInputTextArea.trim() !== '') {
          //   that.logger.debug('[CONV-FOOTER] sendMessage -> ', this.textInputTextArea);
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

  async onEmojiiPickerClicked(){
    // if(this.loadPickerModule){
    //   this.loadPickerModule = false;
    //   // this.divEmojiiContainer.clear();
    //   this.vcref.clear();
    //   const { PickerModule } = await import("@ctrl/ngx-emoji-mart");
    //   import('../conversation-emojii/conversation-emojii.component').then(({ConversationEmojiiComponent})=> {
    //     // const instance = this.divEmojiiContainer.createComponent(ConversationEmojiiComponent);
    //     // // this.divEmojiiContainer.createEmbeddedView(instance.hostView)
    //     // this.divEmojiiContainer.insert(instance.hostView);
    //     // this.divEmojiiContainer = this.selector.createComponent(ConversationEmojiiComponent);
    //     let greetcomp = this.vcref.createComponent(
    //       this.cfr.resolveComponentFactory(ConversationEmojiiComponent)
    //     );
    //     greetcomp.instance.var = 'ssssss'
    //   });
    //   // this.divEmojiiContainer.nativeElement.insertAdjacentHTML('afterbegin', '<emoji-mart id="emoji-mart"' +
    //   // //  '*ngIf="showEmojiPicker"'+
    //   //  'class="emoji-mart"'+
    //   // '[showPreview]="emojiiOptions?.showPreview"'+
    //   // // '[color]="stylesMap?.get("themeColor")"' +
    //   // '[perLine]="emojiiOptions?.emojiPerLine"'+
    //   // '[totalFrequentLines]="emojiiOptions?.totalFrequentLines"'+
    //   // '[enableSearch]="emojiiOptions?.enableSearch"'+
    //   // '[darkMode]="emojiiOptions?.darkMode"'+
    //   // '[include]="emojiiOptions?.include"'+
    //   // '(emojiSelect)="addEmoji($event)">'+
    //   // '</emoji-mart>')

    // }
    //OPEN EMOJII PICKER
    this.onEmojiiPickerShow.emit(!this.isEmojiiPickerShow)
  }

  addEmoji(event){
    this.onEmojiiPickerShow.emit(false); //de-activate emojii picker on select
    this.textInputTextArea = this.textInputTextArea.trimStart() + event.emoji.native + " "
    this.setFocusOnId('chat21-main-message-context')
  }


  openNewConversation(){
    this.onNewConversationButtonClicked.emit();
  }

  // onContinueConversation(){
  //   this.hideTextAreaContent = false;
  //   this.onBackButton.emit(false)
  //   this.restoreTextArea()
  // }

  onBackButtonFN(){
    this.onBackButton.emit(false)
  }

  setFocusOnId(id) {
    if(!this.isMobile){
      setTimeout(function () {
        const textarea = document.getElementById(id);
        if (textarea) {
            //   that.logger.debug('[CONV-FOOTER] 1--------> FOCUSSSSSS : ', textarea);
            textarea.setAttribute('value', ' ');
            textarea.focus();
        }
      }, 500);
    }
    
  }

  removeFocusOnId(id){
    const textarea = document.getElementById(id);
    if (textarea) {
        textarea.blur()
    }
  }

  /**
   *
   * @param str
   */
  setWritingMessages(str) {
    //this.messagingService.setWritingMessages(str, this.g.channelType);
    this.typingService.setTyping(this.conversationWith, str, this.senderId, this.userFullname )
  }

  /**
   * when I press a key I call this method which:
   * check if 'enter' has been pressed
   * if you clear text
   * set field height as min by default
   * takes out the focus and resets it after a few moments
   * (this is a patch to keep the focus and eliminate the br of the send !!!)
   * send message
   * @param event
   */
  onkeypress(event) {
    const keyCode = event.which || event.keyCode;
    this.textInputTextArea = ((document.getElementById('chat21-main-message-context') as HTMLInputElement).value);
    if (keyCode === 13) { // ENTER pressed
      if (this.textInputTextArea && this.textInputTextArea.trim() !== '') {
        //   that.logger.debug('[CONV-FOOTER] sendMessage -> ', this.textInputTextArea);
        // this.resizeInputField();
        // this.messagingService.sendMessage(msg, TYPE_MSG_TEXT);
        // this.setDepartment();
        // this.textInputTextArea = replaceBr(this.textInputTextArea);
        this.sendMessage(this.textInputTextArea, TYPE_MSG_TEXT);
        // this.restoreTextArea();
      }
    } else if (keyCode === 9) { // TAB pressed
      event.preventDefault();
    }
  }

  
  /**
  * HANDLE: cmd+enter, shiftKey+enter, alt+enter, ctrl+enter
  * @param event 
  */
  onkeydown(event){
    const keyCode = event.which || event.keyCode;
    // metaKey -> COMMAND ,  shiftKey -> SHIFT, altKey -> ALT, ctrlKey -> CONTROL
    if( (event.metaKey || event.shiftKey || event.altKey || event.ctrlKey) && keyCode===13){  
      event.preventDefault();
      this.textInputTextArea += '\r\n';
      this.resizeInputField();
    }
  }
  
  onPaste(event){
    this.resizeInputField()
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    let file = null;
    this.logger.debug('[CONV-FOOTER] onPaste items ', items);
    for (const item of items) {
      this.logger.debug('[CONV-FOOTER] onPaste item ', item);
      this.logger.debug('[CONV-FOOTER] onPaste item.type ', item.type);
      if (item.type.startsWith("image")) {
        // SEND TEXT MESSAGE IF EXIST
        // if(this.textInputTextArea){
        //   this.logger.debug('[CONV-FOOTER] onPaste texttt ', this.textInputTextArea);
        //   this.sendMessage(this.textInputTextArea, TYPE_MSG_TEXT)
        // }

        try {
          this.restoreTextArea();
        } catch(e) {
          this.logger.error('[CONV-FOOTER] onPaste - error while restoring textArea:',e)
        }
        
        this.logger.debug('[CONV-FOOTER] onPaste item.type', item.type);
        file = item.getAsFile();
        const data = {target: new ClipboardEvent('').clipboardData || new DataTransfer()};
        data.target.items.add(new File([file], file.name, { type: file.type }));
        this.logger.debug('[CONV-FOOTER] onPaste data', data);
        this.logger.debug('[CONV-FOOTER] onPaste file ', file);
        this.detectFiles(data)
      }
    }
  }

  onDrop(event){
    const items = event.dataTransfer.files;
    let file = null;
    this.logger.debug('[CONV-FOOTER] onDrop items ', items);
    for (const item of items) {
      this.logger.debug('[CONV-FOOTER] onDrop item ', item);
      this.logger.debug('[CONV-FOOTER] onDrop item.type ', item.type);

      const data = {target: {files: new DataTransfer()}}
      data.target.files = items
      this.logger.debug('[CONV-FOOTER] onDrop data', data);
      this.logger.debug('[CONV-FOOTER] onDrop file ', file);
      this.detectFiles(data)
    }
  }



  managePoweredBy(event: Event){
    event.stopPropagation();
    this.segmentLogoClick()
    let target = (event.target as Element) || (event.srcElement as Element) || (event.currentTarget as Element)
    if(target.parentElement.tagName === 'A' && target.parentElement.hasAttribute('href')){
     window.open(target.parentElement.getAttribute('href'), '_blank')
    }
  }


  private segmentLogoClick(){
    let that = this
    if(window['analytics']){
      try {
        window['analytics'].page("Widget Conversation Page, LogoClick", {});
      } catch (err) {
        this.logger.error('Event:Signed In [page] error', err);
      }
  
      try {
        window['analytics'].identify(that.senderId, {
          name: that.userFullname,
          email: that.userEmail,
          logins: 5,
        });
      } catch (err) {
        this.logger.error('Event:LogoClick [identify] error', err);
      }
      // Segments
      try {
        window['analytics'].track('LogoClick', {
          "username": that.userFullname,
          "userId": that.userEmail,
          "attributes": that.attributes
        });
      } catch (err) {
        this.logger.error('Event:LogoClick [track] error', err);
      }
    }
  }

}