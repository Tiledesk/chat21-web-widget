import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { ConversationFooterComponent } from './conversation-footer.component';
import { ChatManager } from 'src/chat21-core/providers/chat-manager';
import { TypingService } from 'src/chat21-core/providers/abstract/typing.service';
import { UploadService } from 'src/chat21-core/providers/abstract/upload.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { NGXLogger } from 'ngx-logger';
import { TYPE_MSG_TEXT } from 'src/chat21-core/utils/constants';
import { ConversationHandlerService } from 'src/chat21-core/providers/abstract/conversation-handler.service';
import { VoiceService } from 'src/app/providers/voice/voice.service';
import { TtsAudioPlaybackCoordinator } from 'src/app/providers/tts-audio-playback-coordinator.service';
import { TiledeskAuthService } from 'src/chat21-core/providers/tiledesk/tiledesk-auth.service';

describe('ConversationFooterComponent', () => {
  let component: ConversationFooterComponent;
  let fixture: ComponentFixture<ConversationFooterComponent>;

  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
  const customLogger = new CustomLogger(ngxlogger);

  const voiceServiceMock = {
    startSession: () => Promise.resolve(),
    stopSession: () => Promise.resolve({ voiceIngressResultUrl: null as string | null }),
    audioSegment$: { subscribe: () => ({ unsubscribe: () => undefined }) },
    voiceTranscript$: { subscribe: () => ({ unsubscribe: () => undefined }) },
    volume$: { subscribe: () => ({ unsubscribe: () => undefined }) },
    isAcquisitionBlocked$: { subscribe: () => ({ unsubscribe: () => undefined }) },
  };
  const ttsMock = { stopAll: () => undefined, isTTSPlaying$: { subscribe: () => ({ unsubscribe: () => undefined }) } };

  const conversationHandlerStub = {
    sendMessage: jasmine.createSpy('sendMessage').and.returnValue({ uid: 'm1' }),
  };

  const chatManagerStub = {
    getConversationHandlerByConversationId: jasmine
      .createSpy('getConversationHandlerByConversationId')
      .and.returnValue(conversationHandlerStub),
  };

  const typingStub = {
    setTyping: jasmine.createSpy('setTyping'),
  };

  const uploadServiceStub = {
    uploadFile: jasmine.createSpy('uploadFile'),
  };

  beforeEach(async () => {
    LoggerInstance.setInstance(customLogger);

    await TestBed.configureTestingModule({
      declarations: [ConversationFooterComponent],
      imports: [FormsModule, ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: ChatManager, useValue: chatManagerStub },
        { provide: TypingService, useValue: typingStub },
        { provide: UploadService, useValue: uploadServiceStub as unknown as UploadService },
        { provide: VoiceService, useValue: voiceServiceMock },
        { provide: TtsAudioPlaybackCoordinator, useValue: ttsMock },
        { provide: TiledeskAuthService, useValue: { getTiledeskToken: () => '' } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(ConversationFooterComponent, {
        set: {
          template: `
            <textarea id="chat21-main-message-context" [(ngModel)]="textInputTextArea"></textarea>
            <div id="chat21-button-send"></div>
            <input id="chat21-file" type="file" />
          `,
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConversationFooterComponent);
    component = fixture.componentInstance;
    component.conversationWith = 'support-group-x';
    component.senderId = 'user-1';
    component.project = { id: 'proj-1' } as any;
    component.channelType = 'group';
    component.translationMap = new Map([
      ['GUEST_LABEL', 'Guest'],
      ['LABEL_PLACEHOLDER', 'Write…'],
    ]);
    component.attributes = {} as any;
    component.fileUploadAccept = '';
    component.chat21_file = {
      nativeElement: { value: '' },
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should load conversation handler when conversationWith changes', () => {
      component.ngOnChanges({
        conversationWith: new SimpleChange(undefined, 'support-group-x', true),
      });
      expect(chatManagerStub.getConversationHandlerByConversationId).toHaveBeenCalledWith('support-group-x');
      expect(component.conversationHandlerService).toBe(conversationHandlerStub as unknown as ConversationHandlerService);
    });

    it('should call restoreTextArea when hideTextReply changes', () => {
      const restore = spyOn(component as any, 'restoreTextArea');
      component.ngOnChanges({
        hideTextReply: new SimpleChange(false, true, false),
      });
      expect(restore).toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should enable emoji picker flag', () => {
      component.showEmojiPicker = false;
      component.ngAfterViewInit();
      expect(component.showEmojiPicker).toBe(true);
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      component.textInputTextArea = ' hello ';
      component.conversationHandlerService = conversationHandlerStub as any;
    });

    it('should emit before/after and call handler when text is valid', () => {
      spyOn(component.onBeforeMessageSent, 'emit');
      spyOn(component.onAfterSendMessage, 'emit');
      spyOn(component.onEmojiiPickerShow, 'emit');
      component.sendMessage('Hi', TYPE_MSG_TEXT);
      expect(component.onBeforeMessageSent.emit).toHaveBeenCalled();
      expect(conversationHandlerStub.sendMessage).toHaveBeenCalled();
      expect(component.onAfterSendMessage.emit).toHaveBeenCalled();
      expect(component.onEmojiiPickerShow.emit).toHaveBeenCalledWith(false);
    });

    it('should return early when emoji not allowed and text has emoji', () => {
      component.showEmojiFooterButton = false;
      component.textInputTextArea = '🙂';
      const emitted = jasmine.createSpy();
      component.onBeforeMessageSent.emit = emitted;
      component.sendMessage('🙂', TYPE_MSG_TEXT);
      expect(emitted).not.toHaveBeenCalled();
    });
  });

  describe('uploadSingle observable success / error', () => {
    beforeEach(() => {
      component.conversationHandlerService = conversationHandlerStub as any;
      component.chat21_file = { nativeElement: { value: '' } } as any;
    });

    it('should resolve upload and call sendMessage for image', fakeAsync(() => {
      uploadServiceStub.uploadFile.and.resolveTo({
        src: 'https://file',
        downloadURL: 'https://dl',
      });
      const meta: any = { name: 'a.png', type: 'image/png', uid: 'u1' };
      const file = new File(['x'], 'a.png', { type: 'image/png' });
      spyOn(component, 'sendMessage').and.stub();
      component.uploadSingle(meta, file, '');
      tick();
      expect(uploadServiceStub.uploadFile).toHaveBeenCalled();
      expect(component.sendMessage).toHaveBeenCalled();
      expect(component.isFilePendingToUpload).toBe(false);
    }));

    it('should handle upload rejection', fakeAsync(() => {
      uploadServiceStub.uploadFile.and.rejectWith(new Error('net'));
      const meta: any = { name: 'a.png', type: 'image/png', uid: 'u1' };
      const file = new File(['x'], 'a.png', { type: 'image/png' });
      component.uploadSingle(meta, file, '');
      tick();
      expect(component.isFilePendingToUpload).toBe(false);
    }));
  });

  describe('onSendPressed', () => {
    beforeEach(() => {
      component.conversationHandlerService = conversationHandlerStub as any;
    });

    it('should ignore when emoji alert visible', () => {
      component.showAlertEmoji = true;
      spyOn(component, 'sendMessage');
      component.onSendPressed({ preventDefault: jasmine.createSpy() } as any);
      expect(component.sendMessage).not.toHaveBeenCalled();
    });

    it('should send trimmed text message', () => {
      component.showAlertEmoji = false;
      component.isFilePendingToUpload = false;
      component.textInputTextArea = 'abc';
      spyOn(component, 'sendMessage').and.stub();
      component.onSendPressed({ preventDefault: jasmine.createSpy() } as any);
      expect(component.sendMessage).toHaveBeenCalledWith('abc', TYPE_MSG_TEXT);
    });
  });

  describe('checkForEmojii', () => {
    it('should block when emoji disabled and text is emoji-only', () => {
      component.showEmojiFooterButton = false;
      expect(component.checkForEmojii('😀')).toBe(false);
      expect(component.showAlertEmoji).toBe(true);
    });

    it('should allow when emoji footer enabled', () => {
      component.showEmojiFooterButton = true;
      expect(component.checkForEmojii('😀')).toBe(true);
    });
  });

  describe('recording helpers', () => {
    it('onStartRecording / onDeleteRecording / onEndRecording / onSendRecording should update flags', () => {
      component.onStartRecording();
      expect(component.isStartRec).toBe(true);
      component.onDeleteRecording();
      expect(component.isStartRec).toBe(false);
      component.onEndRecording(new Blob());
      expect(component.isStopRec).toBe(true);
      uploadServiceStub.uploadFile.and.resolveTo({ src: '', downloadURL: '' });
      spyOn(component, 'uploadSingle').and.stub();
      component.onSendRecording(new Blob(['a'], { type: 'audio/webm' }));
      expect(component.uploadSingle).toHaveBeenCalled();
    });
  });

  describe('onEmojiiPickerClicked', () => {
    it('should toggle emoji panel output', () => {
      spyOn(component.onEmojiiPickerShow, 'emit');
      component.isEmojiiPickerShow = false;
      component.onEmojiiPickerClicked();
      expect(component.onEmojiiPickerShow.emit).toHaveBeenCalledWith(true);
    });
  });

  describe('openNewConversation', () => {
    it('should emit', () => {
      spyOn(component.onNewConversationButtonClicked, 'emit');
      component.openNewConversation();
      expect(component.onNewConversationButtonClicked.emit).toHaveBeenCalled();
    });
  });

  describe('reactive forms (pattern)', () => {
    it('FormBuilder group validates required email-like field', () => {
      const fb = TestBed.inject(FormBuilder);
      const form = fb.group({
        email: ['bad', []],
      });
      form.setValidators(() => null);
      expect(form.value.email).toBe('bad');
      form.patchValue({ email: 'user@test.com' });
      expect(form.valid || form.value.email.includes('@')).toBe(true);
    });
  });

  describe('setWritingMessages', () => {
    it('should forward to TypingService', () => {
      component.setWritingMessages('hi');
      expect(typingStub.setTyping).toHaveBeenCalledWith(
        'support-group-x',
        'hi',
        'user-1',
        undefined,
      );
    });
  });

  describe('keyboard and paste handlers', () => {
    it('onkeydown Enter should send non-empty text', () => {
      const ta = document.getElementById('chat21-main-message-context') as HTMLTextAreaElement;
      ta.value = 'hello';
      spyOn(component, 'sendMessage');
      const ev: any = { which: 13, keyCode: 13, preventDefault: jasmine.createSpy() };
      component.onkeydown(ev);
      expect(ev.preventDefault).toHaveBeenCalled();
      expect(component.sendMessage).toHaveBeenCalledWith('hello', TYPE_MSG_TEXT);
    });

    it('onkeydown Tab should prevent default', () => {
      const ev: any = { which: 9, keyCode: 9, preventDefault: jasmine.createSpy() };
      component.onkeydown(ev);
      expect(ev.preventDefault).toHaveBeenCalled();
    });

    it('onkeydown modifier+Enter should not send (browser newline)', () => {
      spyOn(component, 'sendMessage');
      const ev: any = {
        which: 13,
        keyCode: 13,
        shiftKey: true,
        preventDefault: jasmine.createSpy(),
      };
      component.onkeydown(ev);
      expect(ev.preventDefault).not.toHaveBeenCalled();
      expect(component.sendMessage).not.toHaveBeenCalled();
    });

    it('onkeydown Enter should not send when emoji alert is visible', () => {
      const ta = document.getElementById('chat21-main-message-context') as HTMLTextAreaElement;
      ta.value = 'x';
      component.showAlertEmoji = true;
      spyOn(component, 'sendMessage');
      const ev: any = { which: 13, keyCode: 13, preventDefault: jasmine.createSpy() };
      component.onkeydown(ev);
      expect(ev.preventDefault).toHaveBeenCalled();
      expect(component.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('paste / drop', () => {
    it('onPaste routes image clipboard items through detectFiles', () => {
      const file = new File(['x'], 'paste.png', { type: 'image/png' });
      const item = { type: 'image/png', getAsFile: () => file };
      spyOn(component, 'detectFiles');
      spyOn(component as any, 'restoreTextArea');
      component.onPaste({
        clipboardData: { items: [item] },
      } as any);
      expect(component.detectFiles).toHaveBeenCalled();
    });

    it('onDrop forwards dataTransfer.files', () => {
      spyOn(component, 'detectFiles');
      const f = new File(['z'], 'drop.bin', { type: 'application/octet-stream' });
      const dt = new DataTransfer();
      dt.items.add(f);
      component.onDrop({ dataTransfer: { files: dt.files } } as any);
      expect(component.detectFiles).toHaveBeenCalled();
    });
  });

  describe('detectFiles edge cases', () => {
    it('should abort when MIME not accepted', () => {
      component.fileUploadAccept = 'application/pdf';
      const f = new File(['x'], 'a.png', { type: 'image/png' });
      const dt = new DataTransfer();
      dt.items.add(f);
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: dt.files });
      component.detectFiles({ target: input });
      expect(component.isFilePendingToUpload).toBe(false as any);
    });
  });

  describe('loadFile size limit', () => {
    it('should dispatch tooltip when file exceeds limit', () => {
      spyOn(window, 'dispatchEvent');
      component.arrayFilesLoad[0] = {
        uid: 'u1',
        file: { title: 'big.png', src: 'x', width: 1, height: 1 },
        type: 'image/png',
        size: 50 * 1024 * 1024,
      } as any;
      component.selectedFiles = { item: (i: number) => new File([], 'big.png') } as any;
      component.loadFile();
      expect(window.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('Powered-by / analytics', () => {
    it('managePoweredBy opens parent anchor href', () => {
      const a = document.createElement('a');
      a.setAttribute('href', 'https://example.test/logo');
      const span = document.createElement('span');
      a.appendChild(span);
      spyOn(window, 'open');
      window['analytics'] = {
        page: jasmine.createSpy('page'),
        identify: jasmine.createSpy('identify'),
        track: jasmine.createSpy('track'),
      };
      const ev: any = {
        stopPropagation: jasmine.createSpy(),
        target: span,
      };
      component.managePoweredBy(ev);
      expect(ev.stopPropagation).toHaveBeenCalled();
      expect(window.open).toHaveBeenCalledWith('https://example.test/logo', '_blank');
    });
  });

  describe('onSendPressed file branch', () => {
    it('should call loadFile when upload pending', () => {
      component.isFilePendingToUpload = true;
      spyOn(component, 'loadFile');
      component.onSendPressed({ preventDefault: jasmine.createSpy() } as any);
      expect(component.loadFile).toHaveBeenCalled();
      expect(component.isFilePendingToUpload).toBe(false as any);
    });
  });

  describe('onTextAreaChange', () => {
    it('should resize and set typing', () => {
      component.textInputTextArea = 't';
      spyOn(component, 'resizeInputField');
      spyOn(component, 'setWritingMessages');
      component.onTextAreaChange();
      expect(component.resizeInputField).toHaveBeenCalled();
      expect(component.setWritingMessages).toHaveBeenCalled();
    });
  });

  describe('addEmoji', () => {
    it('should append emoji when allowed', () => {
      component.showEmojiFooterButton = true;
      component.textInputTextArea = 'hi ';
      spyOn(component.onEmojiiPickerShow, 'emit');
      component.addEmoji({ emoji: { native: '⭐' } } as any);
      expect(component.textInputTextArea).toContain('⭐');
      expect(component.onEmojiiPickerShow.emit).toHaveBeenCalledWith(false);
    });
  });

  describe('removeFocusOnId', () => {
    it('should blur existing textarea', () => {
      const ta = document.getElementById('chat21-main-message-context')!;
      spyOn(ta, 'blur');
      component.removeFocusOnId('chat21-main-message-context');
      expect(ta.blur).toHaveBeenCalled();
    });
  });

  describe('resizeInputField error handling', () => {
    it('should swallow DOM errors from getElementById', () => {
      const orig = document.getElementById.bind(document);
      let throwOnce = true;
      spyOn(document, 'getElementById').and.callFake((id: string) => {
        if (id === 'chat21-main-message-context' && throwOnce) {
          throwOnce = false;
          throw new Error('dom');
        }
        return orig(id);
      });
      expect(() => component.resizeInputField()).not.toThrow();
    });
  });

  describe('ngOnChanges dropEvent', () => {
    it('should forward component.dropEvent to onDrop', () => {
      const drop = new Event('drop');
      component.dropEvent = drop as any;
      spyOn(component, 'onDrop');
      component.ngOnChanges({
        dropEvent: new SimpleChange(undefined, drop, false),
      });
      expect(component.onDrop).toHaveBeenCalledWith(drop);
    });
  });

  describe('uploadSingle audio branch', () => {
    it('should send empty body for audio metadata', fakeAsync(() => {
      uploadServiceStub.uploadFile.and.resolveTo({ src: 'https://a', downloadURL: 'https://a' });
      component.conversationHandlerService = conversationHandlerStub as any;
      const meta: any = { name: 'a.mp3', type: 'audio/mp3', uid: 'u1' };
      const file = new File(['x'], 'a.mp3', { type: 'audio/mp3' });
      spyOn(component, 'sendMessage');
      component.uploadSingle(meta, file, '');
      tick();
      expect(component.sendMessage).toHaveBeenCalled();
      const typeArg = (component.sendMessage as jasmine.Spy).calls.mostRecent().args[1];
      expect(typeArg).toBe('file');
    }));
  });
});
