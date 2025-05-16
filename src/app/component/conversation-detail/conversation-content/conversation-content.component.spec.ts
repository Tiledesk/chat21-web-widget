import { async, ComponentFixture, TestBed, waitForAsync, inject } from '@angular/core/testing';

import { ConversationContentComponent } from './conversation-content.component';
import { MarkedPipe } from '../../../pipe/marked.pipe';
import { HtmlEntitiesEncodePipe } from '../../../pipe/html-entities-encode.pipe';
import { UploadService } from '../../../../chat21-core/providers/abstract/upload.service';
import { CustomLogger } from '../../../../chat21-core/providers/logger/customLogger';
import { LoggerInstance } from '../../../../chat21-core/providers/logger/loggerInstance';
import { NO_ERRORS_SCHEMA, Injectable } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ImageRepoService } from '../../../../chat21-core/providers/abstract/image-repo.service';

describe('ConversationContentComponent', () => {
  let component: ConversationContentComponent;
  let fixture: ComponentFixture<ConversationContentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ 
        ConversationContentComponent,
        // BubbleMessageComponent,
        // ReturnReceiptComponent,
        // AvatarComponent,
        // InfoMessageComponent,
        // MessageAttachmentComponent,
        // ImageComponent,
        // FrameComponent,
        // TextComponent,
        // TextButtonComponent,
        // LinkButtonComponent,
        // ActionButtonComponent,

        MarkedPipe,
        HtmlEntitiesEncodePipe,
      ],
      imports: [
      ],
      providers: [ 
        UploadService,
        ImageRepoService
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationContentComponent);
    let upload = fixture.debugElement.injector.get(UploadService) as UploadService
    upload.BSStateUpload.next({ upload: 100, type: 'image' })
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a div el with class ".c21-body"', () => {
    const bubble_message = fixture.debugElement.query(By.css('.c21-body'));
    expect(bubble_message).toBeTruthy();
  })

  it('renders a div el with class ".base_receive"', () => {
    const messages: [any] = [{
          attributes: {
              projectId: "6013ec749b32000045be650e",
              tiledesk_message_id: "611cbf8ffb379b00346660e7"
          },
          channel_type: "group",
          recipient: "support-group-6013ec749b32000045be650e-4904aee91f8b487aad117bcda860549d",
          recipient_fullname: "Guest ",
          sender: "bot_602256f6c001b800342cb76f",
          sender_fullname: "BOT2",
          status: 150,
          text: "Hello 👋. I'm a bot 🤖.\n\nChoose one of the options below or write a message to reach our staff.",
          timestamp: 1629273999970,
          type: "text",
          uid: "-MhNI3eaIoLTOLoX3TAu",
          isSender: false
      }
    ]
    component.messages = messages
    component.senderId = '9d3b6aa5-0aea-4b7e-935f-1c1c675cd8d4'
    component.baseLocation = 'http://tiledesk-widget-pre.s3-eu-west-1.amazonaws.com'
    component.translationMap = new Map();
    component.stylesMap = new Map();
    fixture.detectChanges()
    const nativeEl: HTMLElement = fixture.nativeElement;
    const baseReceiveEl = nativeEl.querySelector('.base_receive');
    expect(baseReceiveEl).toBeTruthy();
  });

  it('renders the right textContext of div el with class ".message_sender_fullname"', () => {
    const messages: [any] = [{
          attributes: {
              projectId: "6013ec749b32000045be650e",
              tiledesk_message_id: "611cbf8ffb379b00346660e7"
          },
          channel_type: "group",
          recipient: "support-group-6013ec749b32000045be650e-4904aee91f8b487aad117bcda860549d",
          recipient_fullname: "Guest ",
          sender: "bot_602256f6c001b800342cb76f",
          sender_fullname: "BOT2",
          status: 150,
          text: "Hello 👋. I'm a bot 🤖.\n\nChoose one of the options below or write a message to reach our staff.",
          timestamp: 1629273999970,
          type: "text",
          uid: "-MhNI3eaIoLTOLoX3TAu",
          isSender: false
      }
    ]
    component.messages = messages
    component.senderId = '9d3b6aa5-0aea-4b7e-935f-1c1c675cd8d4'
    component.baseLocation = 'http://tiledesk-widget-pre.s3-eu-west-1.amazonaws.com'
    component.translationMap = new Map();
    component.stylesMap = new Map();
    const nativeEl: HTMLElement = fixture.nativeElement;
    const baseReceiveEl = nativeEl.querySelector('.message_sender_fullname');
    fixture.detectChanges()
    expect(baseReceiveEl.textContent).toBe('BOT2');
  });

  it('renders a chat-avatar-image & chat-bubble-message components in div with ".base_receive" class', () => {
    const messages: Array<any> = [{
          attributes: {
              projectId: "6013ec749b32000045be650e",
              tiledesk_message_id: "611cbf8ffb379b00346660e7"
          },
          channel_type: "group",
          recipient: "support-group-6013ec749b32000045be650e-4904aee91f8b487aad117bcda860549d",
          recipient_fullname: "Guest ",
          sender: "bot_602256f6c001b800342cb76f",
          sender_fullname: "BOT2",
          status: 150,
          text: "Hello 👋. I'm a bot 🤖.\n\nChoose one of the options below or write a message to reach our staff.",
          timestamp: 1629273999970,
          type: "text",
          uid: "-MhNI3eaIoLTOLoX3TAu",
          isSender: false
      },
      {
        attributes: {
            projectId: "6013ec749b32000045be650e",
            tiledesk_message_id: "611cbf8ffb379b00346660e7"
        },
        channel_type: "group",
        recipient: "support-group-6013ec749b32000045be650e-4904aee91f8b487aad117bcda860549d",
        recipient_fullname: "Guest ",
        sender: "bot_602256f6c001b800342cb76f",
        sender_fullname: "BOT1",
        status: 150,
        text: "Hello 👋. I'm a bot 🤖.\n\nChoose one of the options below or write a message to reach our staff.",
        timestamp: 1629273999970,
        type: "text",
        uid: "-MhNI3eaIoLTOLoX3TAu",
        isSender: false
    }
    ]
    component.messages = messages
    component.senderId = '9d3b6aa5-0aea-4b7e-935f-1c1c675cd8d4'
    component.baseLocation = 'http://tiledesk-widget-pre.s3-eu-west-1.amazonaws.com'
    component.translationMap = new Map();
    component.stylesMap = new Map();
    
    const nativeEl: HTMLElement = fixture.nativeElement;
    const baseReceiveEl = nativeEl.querySelectorAll('.base_receive')
    const chatImageComponentChild = baseReceiveEl[0].querySelector('chat-avatar-image')
    const bubbleMessageComponentChild = baseReceiveEl[0].querySelector('chat-bubble-message.msg_receive')
    fixture.detectChanges()
    expect(chatImageComponentChild).toBeTruthy();
    expect(bubbleMessageComponentChild).toBeTruthy();
  });

});
