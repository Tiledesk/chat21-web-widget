import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAX_WIDTH_IMAGES, MIN_WIDTH_IMAGES } from 'src/chat21-core/utils/constants';
import { calcImageSize } from 'src/chat21-core/utils/utils-message';
import { JsonSourcesParserService } from 'src/app/providers/json-sources-parser.service';
import { VoiceService } from 'src/app/providers/voice/voice.service';

import { BubbleMessageComponent } from './bubble-message.component';

describe('BubbleMessageComponent', () => {
  let component: BubbleMessageComponent;
  let fixture: ComponentFixture<BubbleMessageComponent>;

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
        { provide: JsonSourcesParserService, useValue: jsonSourcesParserMock },
        { provide: VoiceService, useValue: voiceServiceMock },
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
    it('should scale down when width exceeds MAX_WIDTH_IMAGES', () => {
      const meta = { width: MAX_WIDTH_IMAGES * 2, height: 100 };
      const s = calcImageSize(meta);
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
});
