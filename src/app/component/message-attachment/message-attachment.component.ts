import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

// models
import { MessageModel } from 'src/chat21-core/models/message';

@Component({
  selector: 'chat-message-attachment',
  templateUrl: './message-attachment.component.html',
  styleUrls: ['./message-attachment.component.scss']
})
export class MessageAttachmentComponent implements OnInit {

  // ========= begin:: Input/Output values ============//
  @Input() message: MessageModel;
  @Input() isConversationArchived: boolean;
  @Input() isLastMessage: boolean;
  @Input() fullscreenMode: boolean;
  @Input() limit: number;
  @Input() stylesMap: Map<string, string>;
  @Output() onAttachmentButtonClicked = new EventEmitter<any>();
  @Output() onElementRendered = new EventEmitter<{element: string, status: boolean}>()
  // ========= end:: Input/Output values ============//

  public type: string;
  public buttons: [any];

  constructor() { }

  ngOnInit() {
    this.getAttachmentButton();
  }

  /** */
  getAttachmentButton() {
    if (this.message && this.message.attributes && this.message.attributes.attachment) {
      try {
        this.type = this.message.attributes.attachment.type;
        // console.log(this.type);
      } catch (error) {
        // this.g.wdLog(['> Error :' + error]);
        return;
      }
      try {
        this.buttons = this.message.attributes.attachment.buttons;
      } catch (error) {
        // this.g.wdLog(['> Error :' + error]);
        return;
      }
    }
  }

  ngAfterViewInit(){
    this.onElementRendered.emit({element: 'attachment', status: true})
  }

  returnOnAttachmentButtonClicked(event: any){
    if ( event && event.target ) {
      const ev = {target: event.target, message: this.message, currentTarget: this }
      this.onAttachmentButtonClicked.emit(ev);
    }
  }

  // actionButtonText(event: any) {
  //   if ( event ) {
  //     this.eventOpenAttachment.emit(event.value);
  //   }
  // }

  /** */
  // actionButtonUrl(event: any) {
  //   if ( event && event.link && event.link !== '') {
  //     this.eventClickOnAttachmentButton.emit(event);
  //   }
  // }

  // actionButtonAction(event: any) {
  //   if ( event && event.action && event.action !== '') {
  //     const spanCheck = window.document.getElementById('actionButton');
  //     if (spanCheck) {
  //       spanCheck.classList.add('active');
  //       setTimeout(function() {
  //         spanCheck.classList.remove('active');
  //       }, 400);
  //     }
  //     this.eventClickOnAttachmentButton.emit(event);
  //   }
  // }
}
