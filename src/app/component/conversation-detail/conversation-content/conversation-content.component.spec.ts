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

  describe('scroll and badge', () => {
    beforeEach(() => {
      const scrollHost = document.createElement('div');
      scrollHost.style.height = '100px';
      scrollHost.style.overflow = 'auto';
      const inner = document.createElement('div');
      inner.style.height = '300px';
      scrollHost.appendChild(inner);
      component.scrollMe = { nativeElement: scrollHost } as any;
    });

    it('onScroll should emit true at bottom', () => {
      spyOn(component.onScrollContent, 'emit');
      const el = component.scrollMe.nativeElement;
      el.scrollTop = el.scrollHeight - el.clientHeight;
      component.onScroll({ target: el });
      expect(component.onScrollContent.emit).toHaveBeenCalledWith(true);
    });

    it('checkContentScrollPosition should return false when not at bottom', () => {
      spyOn(component, 'checkContentScrollPosition').and.callThrough();
      const el = component.scrollMe.nativeElement;
      Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 500 });
      Object.defineProperty(el, 'clientHeight', { configurable: true, value: 100 });
      el.scrollTop = 0;
      expect(component.checkContentScrollPosition(el)).toBe(false);
    });

    it('scrollToBottom should emit onScrollContent true', fakeAsync(() => {
      const wrap = document.createElement('div');
      wrap.style.height = '40px';
      wrap.style.overflow = 'auto';
      const inner = document.createElement('div');
      inner.id = 'c21-contentScroll';
      inner.style.height = '200px';
      wrap.appendChild(inner);
      document.body.appendChild(wrap);
      spyOn(component.onScrollContent, 'emit');
      component.scrollToBottom(true);
      tick(0);
      expect(component.onScrollContent.emit).toHaveBeenCalledWith(true);
      document.body.removeChild(wrap);
    }));
  });

  describe('emitters', () => {
    it('hideOutsideElements should close menus', () => {
      spyOn(component.onMenuOptionShow, 'emit');
      spyOn(component.onEmojiiPickerShow, 'emit');
      component.hideOutsideElements();
      expect(component.onMenuOptionShow.emit).toHaveBeenCalledWith(false);
      expect(component.onEmojiiPickerShow.emit).toHaveBeenCalledWith(false);
    });

    it('onAttachmentButtonClickedFN should forward event', () => {
      spyOn(component.onAttachmentButtonClicked, 'emit');
      const ev = { a: 1 };
      component.onAttachmentButtonClickedFN(ev);
      expect(component.onAttachmentButtonClicked.emit).toHaveBeenCalledWith(ev);
    });

    it('onBeforeMessageRenderFN / onAfterMessageRenderFN should emit', () => {
      spyOn(component.onBeforeMessageRender, 'emit');
      spyOn(component.onAfterMessageRender, 'emit');
      const ev = { x: 'y' };
      component.onBeforeMessageRenderFN(ev);
      component.onAfterMessageRenderFN(ev);
      expect(component.onBeforeMessageRender.emit).toHaveBeenCalledWith(ev);
      expect(component.onAfterMessageRender.emit).toHaveBeenCalledWith(ev);
    });

    it('onElementRenderedFN with status should call scrollToBottom', () => {
      spyOn(component, 'scrollToBottom');
      component.scrollMe = { nativeElement: document.createElement('div') } as any;
      component.onElementRenderedFN({ status: true });
      expect(component.scrollToBottom).toHaveBeenCalled();
    });

    it('onElementRenderedFN with status false should not scroll', () => {
      spyOn(component, 'scrollToBottom');
      component.scrollMe = { nativeElement: document.createElement('div') } as any;
      component.onElementRenderedFN({ status: false });
      expect(component.scrollToBottom).not.toHaveBeenCalled();
    });
  });

  describe('upload observable edge cases', () => {
    it('should ignore null BSStateUpload payloads', () => {
      component.showUploadProgress = true;
      uploadState$.next(null);
      expect(component.showUploadProgress).toBe(true);
    });

    it('should treat NaN upload as complete for progress UI', () => {
      uploadState$.next({ upload: NaN, type: 'image/png' });
      expect(component.showUploadProgress).toBe(false);
    });
  });

  describe('onScroll without ViewChild', () => {
    it('should not emit when scrollMe is missing', () => {
      spyOn(component.onScrollContent, 'emit');
      component.scrollMe = undefined as any;
      component.onScroll({ target: document.createElement('div') });
      expect(component.onScrollContent.emit).not.toHaveBeenCalled();
    });
  });

  describe('scrollToBottom error path (sync)', () => {
    it('should log when getElementById throws synchronously', () => {
      spyOn(document, 'getElementById').and.throwError('no-dom');
      spyOn((component as any).logger, 'error');
      component.scrollToBottom();
      expect((component as any).logger.error).toHaveBeenCalled();
    });
  });

  describe('message helper delegates', () => {
    it('isLastMessage / isSameSender / isFirstMessage use messages array', () => {
      component.messages = [
        { uid: 'm1', sender: 'alice' },
        { uid: 'm2', sender: 'alice' },
      ] as any;
      expect(component.isLastMessage('m2')).toBe(true);
      expect(component.isSameSender('alice', 1)).toBe(true);
      expect(component.isFirstMessage('alice', 0)).toBe(true);
    });

    it('isLastIncomingMessage should ignore the last row if it is the user', () => {
      component.messages = [
        { uid: 'b1', isSender: false, sender: 'bot' },
        { uid: 'u1', isSender: true, sender: 'user' },
      ] as any;
      expect(component.isLastIncomingMessage(component.messages[0])).toBe(true);
      expect(component.isLastIncomingMessage(component.messages[1])).toBe(false);
    });
  });

  describe('getMetadataSize string width', () => {
    it('should not scale when width is non-numeric string', () => {
      const s = component.getMetadataSize({ width: '100%', height: 200 });
      expect(s.width).toBe('100%');
    });
  });

  describe('ngOnChanges styles edge', () => {
    it('should not touch DOM when bubble color keys are absent', () => {
      const spy = spyOn((component as any).elementRef.nativeElement, 'querySelector');
      component.stylesMap = new Map();
      component.ngOnChanges({
        stylesMap: new SimpleChange(null, component.stylesMap, false),
      });
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
