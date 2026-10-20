import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { JsonSourcesParserService } from 'src/app/providers/json-sources-parser.service';
import { VoiceService } from 'src/app/providers/voice/voice.service';
import { of, Subject } from 'rxjs';
import { MAX_WIDTH_IMAGES, MIN_WIDTH_IMAGES } from 'src/chat21-core/utils/constants';

import { BubbleMessageComponent } from './bubble-message.component';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { calcImageSize } from 'src/chat21-core/utils/utils-message';

const textMessage: any = {
  attributes: { projectId: 'p1' },
  channel_type: 'group',
  recipient: 'support-group-x',
  recipient_fullname: 'Guest',
  sender: 'bot_1',
  sender_fullname: 'BOT',
  status: 150,
  text: 'Hello',
  timestamp: 1629273999970,
  type: 'text',
  uid: 'msg-hello',
  isSender: false,
};

function sizeFromMetadata(metadata: any) {
  return calcImageSize(metadata);
}

describe('BubbleMessageComponent', () => {
  let component: BubbleMessageComponent;
  let fixture: ComponentFixture<BubbleMessageComponent>;
  const karaoke$ = new Subject<any>();

  const jsonSourcesParserMock = {
    getUrlPreviewPayload: () => null,
    parseBaseFromMessage: () => null,
    enrichSources: jasmine.createSpy('enrichSources').and.resolveTo([]),
  };

  const voiceServiceMock = {
    isWssVoiceActive: false,
    markProxyHandled: jasmine.createSpy('markProxyHandled'),
    voiceTtsKaraoke$: {
      pipe: () => ({
        subscribe: () => ({ unsubscribe: () => undefined }),
      }),
    },
  };

  const textMessage: any = {
    attributes: { projectId: 'p1' },
    channel_type: 'group',
    recipient: 'support-group-x',
    recipient_fullname: 'Guest ',
    sender: 'bot_1',
    sender_fullname: 'BOT2',
    status: 150,
    text: 'Hello',
    timestamp: 1629273999970,
    type: 'text',
    uid: 'm1',
    isSender: false,
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BubbleMessageComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: JsonSourcesParserService,
          useValue: {
            parseBaseFromMessage: () => [],
            enrichSources: () => Promise.resolve([]),
          },
        },
        {
          provide: VoiceService,
          useValue: {
            voiceTtsKaraoke$: karaoke$,
            isWssVoiceActive$: of(true),
            isWssVoiceActive: true,
            markProxyHandled: jasmine.createSpy('markProxyHandled'),
            wasProxyHandled: () => false,
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BubbleMessageComponent);
    component = fixture.componentInstance;
    component.stylesMap = new Map([
      ['buttonFontSize', '14px'],
      ['themeColor', '#000'],
      ['foregroundColor', '#fff'],
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a chat-text child for plain text messages', () => {
    component.message = textMessage;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('chat-text'))).toBeTruthy();
  });

  it('should bind chat-text inputs from message', () => {
    component.message = textMessage;
    fixture.detectChanges();
    const textChild = fixture.debugElement.query(By.css('chat-text'));
    expect(textChild.properties.text).toEqual(textMessage.text);
  });
  

  describe('calcImageSize', () => {
    it('should have a text inside "chat-text" child element', () => {
      const messages: any = {
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
      component.message = messages
      // component.textColor = 'black'
      fixture.detectChanges()
      const textChild = fixture.debugElement.query(By.css('chat-text'))
      expect(textChild.properties.text).toEqual(messages.text)
    })
  });
    
  it('should have a text inside "chat-text" child element', () => {
    const messages: any = {
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
    component.message = messages
    // component.textColor = 'black'
    fixture.detectChanges()
    const textChild = fixture.debugElement.query(By.css('chat-text'))
    expect(textChild.properties.text).toEqual(messages.text)
  })

  describe('sizeFromMetadata', () => {
    it('should scale down when width exceeds MAX_WIDTH_IMAGES', () => {
      const s = calcImageSize({ width: MAX_WIDTH_IMAGES * 2, height: 100 });
      expect(s.width).toBe(MAX_WIDTH_IMAGES);
    });

    it('should apply MIN_WIDTH when thumbnail width is small', () => {
      const meta = { width: 40, height: 80 };
      const s = calcImageSize(meta);
      expect(s.width).toBe(MIN_WIDTH_IMAGES);
    });

    it('should keep metadata dimensions for mid-sized images', () => {
      const meta = { width: 120, height: 60 };
      const s = calcImageSize(meta);
      expect(s.width).toBe(120);
      expect(s.height).toBe(60);
    });

    it('should return raw metadata when width branch not matched', () => {
      const s = calcImageSize({ width: undefined, height: 10 });
      expect(s.width).toBeUndefined();
      expect(s.height).toBe(10);
    });

    it('should keep width when it equals MAX_WIDTH_IMAGES', () => {
      const s = calcImageSize({ width: MAX_WIDTH_IMAGES, height: 50 });
      expect(s.width).toBe(MAX_WIDTH_IMAGES);
      expect(s.height).toBe(50);
    });
  });

  describe('reply types from chatbot (image / frame / audio / html)', () => {
    it('should render chat-image for image metadata', () => {
      component.message = {
        ...textMessage,
        type: 'image',
        metadata: { src: 'https://cdn.example/img.png', width: 100, height: 50 },
      };
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('chat-image'))).toBeTruthy();
    });

    it('should render chat-frame for frame metadata', () => {
      component.message = {
        ...textMessage,
        type: 'frame',
        metadata: { src: 'https://player.example/v/1', width: 400, height: 300 },
      };
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('chat-frame'))).toBeTruthy();
    });

    it('should render chat-audio and hide chat-text for audio files', () => {
      component.message = {
        ...textMessage,
        type: 'file',
        text: 'voice',
        metadata: { src: 'blob:audio', type: 'audio/wav' },
      };
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('chat-audio'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('chat-text'))).toBeNull();
    });

    it('should render chat-html when message type is html', () => {
      component.message = { ...textMessage, type: 'html', text: '<b>hi</b>' };
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('chat-html'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('chat-text'))).toBeNull();
    });

    it('should show sender fullname for others when not same sender', () => {
      component.message = { ...textMessage, isSender: false, sender_fullname: 'Reply types Chatbot' };
      component.isSameSender = false;
      fixture.detectChanges();
      const name = fixture.debugElement.query(By.css('.message_sender_fullname'));
      expect(name).toBeTruthy();
      expect(name.nativeElement.textContent).toContain('Reply types Chatbot');
    });

    it('should hide sender fullname when isSameSender', () => {
      component.message = { ...textMessage, isSender: false, sender_fullname: 'Reply types Chatbot' };
      component.isSameSender = true;
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.message_sender_fullname'))).toBeNull();
    });
  });

  describe('ngOnChanges', () => {
    it('should compute sizeImage from message metadata object', () => {
      component.message = {
        ...textMessage,
        metadata: { width: 100, height: 50 },
      };
      component.ngOnChanges();
      expect(component.sizeImage.width).toBe(100);
    });

    it('should ignore non-object metadata', () => {
      component.message = { ...textMessage, metadata: 'x' as any };
      component.ngOnChanges();
      expect(component.sizeImage).toBeUndefined();
    });

    it('should derive fullnameColor from fontColor', () => {
      component.message = textMessage;
      component.fontColor = '#ff0000';
      component.ngOnChanges();
      expect(component.fullnameColor).toBeTruthy();
    });

    it('should prefer sender fullname color when name present', () => {
      component.message = { ...textMessage, sender_fullname: 'Anna' };
      component.fontColor = '#00ff00';
      component.ngOnChanges();
      expect(component.fullnameColor).toBeTruthy();
    });

    it('should not override fontColor when sender_fullname is whitespace', () => {
      component.message = { ...textMessage, sender_fullname: '   ' };
      component.fontColor = '#ff0000';
      component.ngOnChanges();
      expect(component.fullnameColor).toBeTruthy();
    });
  });

  describe('emitters', () => {
    beforeEach(() => {
      component.message = textMessage;
    });

    it('onBeforeMessageRenderFN should emit with sanitizer and message', () => {
      spyOn(component.onBeforeMessageRender, 'emit');
      const ev = { messageEl: {}, component: {} };
      component.onBeforeMessageRenderFN(ev);
      expect(component.onBeforeMessageRender.emit).toHaveBeenCalled();
      const arg = (component.onBeforeMessageRender.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(arg.message).toBe(component.message);
      expect(arg.sanitizer).toBe(component.sanitizer);
    });

    it('onAfterMessageRenderFN should emit', () => {
      spyOn(component.onAfterMessageRender, 'emit');
      const ev = { messageEl: {}, component: {} };
      component.onAfterMessageRenderFN(ev);
      expect(component.onAfterMessageRender.emit).toHaveBeenCalled();
    });

    it('onElementRenderedFN should forward element and status', () => {
      spyOn(component.onElementRendered, 'emit');
      component.onElementRenderedFN({ element: 'image', status: true });
      expect(component.onElementRendered.emit).toHaveBeenCalledWith({ element: 'image', status: true });
    });
  });

  describe('incoming stream animation', () => {
    it('should not stream words on an older incoming message with the same text', () => {
      component.message = { ...textMessage, isJustRecived: true, isSender: false };
      component.streamOnArrival = true;
      component.isLastIncoming = false;
      component.ngOnChanges();
      expect(component._isStreaming).toBe(false);
    });

    it('should stream words only on the last incoming message', () => {
      component.message = { ...textMessage, isJustRecived: true, isSender: false };
      component.streamOnArrival = true;
      component.isLastIncoming = true;
      component.ngOnChanges();
      expect(component._isStreaming).toBe(true);
      expect(component._streamingWords.map((w) => w.word)).toEqual(['Hello']);
    });

    it('should freeze streaming when the bubble is no longer last incoming', () => {
      component.message = { ...textMessage, isJustRecived: true, isSender: false };
      component.streamOnArrival = true;
      component.isLastIncoming = true;
      component.ngOnChanges();
      expect(component._isStreaming).toBe(true);
      component.streamOnArrival = false;
      component.isLastIncoming = false;
      component.ngOnChanges();
      expect(component._isStreaming).toBe(false);
    });

    it('should not start word stream when stream-audio is toggled on an already visible bubble', () => {
      component.message = { ...textMessage, isJustRecived: true, isSender: false };
      component.streamOnArrival = false;
      component.isLastIncoming = true;
      component.ngOnChanges();
      expect(component._hasRenderedStatic).toBe(true);
      expect(component._isStreaming).toBe(false);

      component.streamOnArrival = true;
      component.ngOnChanges({
        streamOnArrival: new SimpleChange(false, true, false),
      });
      expect(component._isStreaming).toBe(false);
    });

    it('should keep karaoke static on a bubble that was already visible', () => {
      const tts = {
        ...textMessage,
        type: 'tts',
        uid: 'old-tts',
        text: 'Hello world',
        metadata: { src: 'blob:x', type: 'audio/mpeg' },
      };
      component.message = tts;
      component.streamOnArrival = false;
      component.isLastIncoming = true;
      component.ngOnChanges();
      component.ngOnInit();
      const seen: string[][] = [];
      const sub = component._wssKaraokeWords$!.subscribe((words) => {
        seen.push(words.map((w) => w.state));
      });
      karaoke$.next({
        text: 'Hello world',
        words: [
          { text: 'Hello', state: 'active' },
          { text: 'world', state: 'future' },
        ],
        activeIndex: 0,
      });
      expect(seen[seen.length - 1]).toEqual(['past', 'past']);
      sub.unsubscribe();
    });

    it('should ignore karaoke frames on older bubbles that share the spoken text', () => {
      const tts = {
        ...textMessage,
        type: 'tts',
        uid: 'old-tts',
        text: 'Hello world',
        metadata: { src: 'blob:x', type: 'audio/mpeg' },
      };
      component.message = tts;
      component.isLastIncoming = false;
      component.ngOnInit();
      const seen: string[][] = [];
      const sub = component._wssKaraokeWords$!.subscribe((words) => {
        seen.push(words.map((w) => w.state));
      });
      karaoke$.next({
        text: 'Hello world',
        words: [
          { text: 'Hello', state: 'active' },
          { text: 'world', state: 'future' },
        ],
        activeIndex: 0,
      });
      expect(seen[seen.length - 1]).toEqual(['past', 'past']);

      component.isLastIncoming = true;
      karaoke$.next({
        text: 'Hello world',
        words: [
          { text: 'Hello', state: 'active' },
          { text: 'world', state: 'future' },
        ],
        activeIndex: 0,
      });
      expect(seen[seen.length - 1]).toEqual(['active', 'future']);
      sub.unsubscribe();
    });
  });
});
