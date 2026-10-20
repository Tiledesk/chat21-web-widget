import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Subject, BehaviorSubject } from 'rxjs';

import { ConversationComponent } from './conversation.component';
import { Globals } from '../../../utils/globals';
import { AppConfigService } from '../../../providers/app-config.service';
import { AppStorageService } from 'src/chat21-core/providers/abstract/app-storage.service';
import { StarRatingWidgetService } from '../../../providers/star-rating-widget.service';
import { ConversationHandlerBuilderService } from 'src/chat21-core/providers/abstract/conversation-handler-builder.service';
import { ChatManager } from 'src/chat21-core/providers/chat-manager';
import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';
import { TypingService } from 'src/chat21-core/providers/abstract/typing.service';
import { TiledeskRequestsService } from 'src/chat21-core/providers/tiledesk/tiledesk-requests.service';
import { EventsService } from '../../../providers/events.service';
import { MessageModel } from 'src/chat21-core/models/message';
import { HEADER_MENU_OPTION } from 'src/app/utils/constants';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
describe('ConversationComponent', () => {
  let component: ConversationComponent;
  let fixture: ComponentFixture<ConversationComponent>;
  let globals: Globals;

  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
  const customLogger = new CustomLogger(ngxlogger);

  let conversationHandlerMock: {
    messageAdded: Subject<MessageModel>;
    messageWait: Subject<any>;
    messageInfo: Subject<any>;
    messages: MessageModel[];
    connect: jasmine.Spy;
    initialize: jasmine.Spy;
    sendMessage: jasmine.Spy;
  };

  const setupHandler = () => {
    conversationHandlerMock = {
      messageAdded: new Subject(),
      messageWait: new Subject(),
      messageInfo: new Subject(),
      messages: [],
      connect: jasmine.createSpy('connect'),
      initialize: jasmine.createSpy('initialize').and.returnValue(Promise.resolve()),
      sendMessage: jasmine.createSpy('sendMessage').and.returnValue({ uid: 'm1', sender: 'me' }),
    };
    return conversationHandlerMock;
  };

  let chatManagerStub: any;
  let tiledeskStub: any;
  let starRatingStub: any;
  let builderStub: { build: jasmine.Spy };

  beforeEach(async () => {
    LoggerInstance.setInstance(customLogger);
    setupHandler();

    const convHandlerSvc = {
      getConversationDetail: jasmine.createSpy('getConversationDetail').and.callFake((id: string, cb: (c: any) => void) => {
        cb(null);
      }),
      conversationRemoved: new Subject<any>(),
      conversationChanged: new Subject<any>(),
      setConversationRead: jasmine.createSpy('setConversationRead'),
      countIsNew: jasmine.createSpy('countIsNew').and.returnValue(0),
    };

    const archivedSvc = {
      getConversationDetail: jasmine.createSpy('archGet').and.callFake((id: string, cb: (c: any) => void) => {
        cb(null);
      }),
      setConversationRead: jasmine.createSpy('setConversationReadArchived'),
    };

    chatManagerStub = {
      getConversationHandlerByConversationId: jasmine.createSpy('getH').and.returnValue(null),
      addConversationHandler: jasmine.createSpy('addH'),
      conversationsHandlerService: convHandlerSvc,
      archivedConversationsService: archivedSvc,
    };

    tiledeskStub = {
      getMyRequests: jasmine.createSpy('getMyRequests').and.resolveTo({ requests: [] }),
      closeSupportGroup: jasmine.createSpy('closeSupportGroup').and.resolveTo('closed'),
    };

    starRatingStub = {
      obsCloseConversation: new BehaviorSubject<boolean | null>(false),
      setOsservable: jasmine.createSpy('setOsservable'),
    };

    const customTranslateStub = {
      translateLanguage: jasmine.createSpy('translateLanguage').and.callFake((keys: string[]) => {
        const m = new Map<string, string>();
        keys.forEach((k) => m.set(k, k));
        return m;
      }),
    };

    builderStub = {
      build: jasmine.createSpy('build').and.returnValue(conversationHandlerMock),
    };

    spyOn(ConversationComponent.prototype, 'ngAfterViewInit').and.stub();
    spyOn(ConversationComponent.prototype, 'ngAfterViewChecked').and.stub();
    spyOn(ConversationComponent.prototype, 'ngOnDestroy').and.stub();

    await TestBed.configureTestingModule({
      declarations: [ConversationComponent],
      providers: [
        Globals,
        { provide: AppConfigService, useValue: { getConfig: () => ({ apiUrl: 'https://api.test/' }) } },
        { provide: StarRatingWidgetService, useValue: starRatingStub },
        { provide: AppStorageService, useValue: { getItem: jasmine.createSpy().and.returnValue(null), setItem: jasmine.createSpy(), removeItem: jasmine.createSpy() } },
        { provide: ConversationHandlerBuilderService, useValue: builderStub },
        { provide: ChatManager, useValue: chatManagerStub },
        { provide: CustomTranslateService, useValue: customTranslateStub },
        { provide: TypingService, useValue: { isTyping: jasmine.createSpy(), BSIsTyping: new Subject() } },
        { provide: TiledeskRequestsService, useValue: tiledeskStub },
        EventsService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(ConversationComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConversationComponent);
    component = fixture.componentInstance;

    globals = TestBed.inject(Globals);
    globals.initDefafultParameters();
    globals.setParameter('recipientId', 'support-group-proj-abc');
    globals.setParameter('projectid', 'proj1');
    globals.setParameter('channelType', 'group');
    globals.senderId = 'visitor-1';
    (globals as any).attributes = (globals as any).attributes ?? {};

    component.conversationId = 'support-group-proj-abc';
    component.conversationWith = 'support-group-proj-abc';
    component.senderId = 'visitor-1';
    component.isOpen = true;
    component.stylesMap = new Map([
      ['themeColor', '#2a6ac1'],
      ['foregroundColor', '#fff'],
    ]);

    /** ViewChild refs stay undefined with empty template; assign after first CD cycle. */
    fixture.detectChanges();
    component.conversationFooter = {
      sendMessage: jasmine.createSpy('sendMessage'),
      textInputTextArea: '',
      uploadSingle: jasmine.createSpy('uploadSingle'),
      isFilePendingToUpload: false,
      removeFocusOnId: jasmine.createSpy('removeFocusOnId'),
    } as any;

    component.conversationContent = {
      scrollToBottom: jasmine.createSpy('scrollToBottom'),
      checkContentScrollPosition: jasmine.createSpy('checkContentScrollPosition').and.returnValue(true),
      scrollMe: { nativeElement: { style: { height: '' } } },
    } as any;

    component.mydialog = {
      nativeElement: { showModal: jasmine.createSpy('showModal'), close: jasmine.createSpy('close') },
    } as any;

    component.conversationsHandlerService = chatManagerStub.conversationsHandlerService as any;
    component.archivedConversationsHandlerService = chatManagerStub.archivedConversationsService as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialise translations and default welcome flag', () => {
      expect(component.showMessageWelcome).toBe(false);
      expect(component.translationMapHeader).toBeDefined();
      expect(component.translationMapFooter).toBeDefined();
    });
  });

  describe('scrollToBottom and translations', () => {
    it('scrollToBottom should delegate to conversation content', () => {
      component.scrollToBottom();
      expect(component.conversationContent.scrollToBottom).toHaveBeenCalled();
    });

    it('translations should refresh all translation maps', () => {
      component.translations();
      expect(component.translationMapPreview?.size).toBeGreaterThan(0);
      expect(component.translationMapCloseChatDialog?.size).toBeGreaterThan(0);
    });
  });

  describe('updateConversationBadge archived branch', () => {
    it('should call archived handler when conversation is archived', () => {
      component.isConversationArchived = true;
      component.conversationId = 'arch-1';
      component.archivedConversationsHandlerService = chatManagerStub.archivedConversationsService as any;
      component.updateConversationBadge();
      expect(chatManagerStub.archivedConversationsService.setConversationRead).toHaveBeenCalledWith('arch-1');
    });
  });

  describe('drag / drop edge paths', () => {
    it('drag should return early when dropped file type is not allowed (hover unchanged)', () => {
      (globals as any).fileUploadAccept = 'application/pdf';
      component.isHovering = true;
      const dt = new DataTransfer();
      dt.items.add(new File(['x'], 'a.png', { type: 'image/png' }));
      const ev: any = {
        preventDefault: jasmine.createSpy(),
        stopPropagation: jasmine.createSpy(),
        dataTransfer: { files: dt.files },
      };
      component.drag(ev);
      expect(component.isHovering).toBe(true);
    });

    it('drag should clear hovering when there is no file payload', () => {
      component.isHovering = true;
      const ev: any = {
        preventDefault: jasmine.createSpy(),
        stopPropagation: jasmine.createSpy(),
        dataTransfer: null,
      };
      component.drag(ev);
      expect(component.isHovering).toBe(false);
    });
  });

  describe('onResize', () => {
    it('should log resize', () => {
      component.onResize(new Event('resize'));
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnChanges', () => {
    it('should apply CSS variables from stylesMap', () => {
      const el = fixture.nativeElement as HTMLElement;
      spyOn(el.style, 'setProperty');
      (component as any).elementRef = { nativeElement: el };
      component.ngOnChanges({ stylesMap: new SimpleChange(null, component.stylesMap, false) });
      expect(el.style.setProperty).toHaveBeenCalled();
    });
  });

  describe('updateConversationBadge', () => {
    it('should mark conversation read when active list', () => {
      component.isConversationArchived = false;
      component.conversationId = 'c1';
      component.conversationsHandlerService = chatManagerStub.conversationsHandlerService;
      component.updateConversationBadge();
      expect(chatManagerStub.conversationsHandlerService.setConversationRead).toHaveBeenCalledWith('c1');
    });
  });

  describe('getConversationDetail', () => {
    it('should resolve active conversation', fakeAsync(() => {
      chatManagerStub.conversationsHandlerService.getConversationDetail.and.callFake((id: string, cb: any) => cb({ uid: 'x' }));
      let result: boolean | null = null;
      component.getConversationDetail().then((r) => (result = r));
      tick();
      expect(result).toBe(false);
      expect(component.conversation).toEqual({ uid: 'x' } as any);
    }));

    it('should fall back to archived when active missing', fakeAsync(() => {
      chatManagerStub.conversationsHandlerService.getConversationDetail.and.callFake((id: string, cb: any) => cb(null));
      chatManagerStub.archivedConversationsService.getConversationDetail.and.callFake((id: string, cb: any) =>
        cb({ uid: 'arch' }),
      );
      let result: boolean | null = null;
      component.getConversationDetail().then((r) => (result = r));
      tick();
      expect(result).toBe(true);
    }));

    it('should recover when getMyRequests rejects (component catch returns empty list)', async () => {
      chatManagerStub.conversationsHandlerService.getConversationDetail.and.callFake((id: string, cb: any) => cb(null));
      chatManagerStub.archivedConversationsService.getConversationDetail.and.callFake((id: string, cb: any) => cb(null));
      tiledeskStub.getMyRequests.and.returnValue(Promise.reject(new Error('network')));
      await component.getConversationDetail();
      expect(component.isConversationArchived).toBe(true);
    });

    it('should match request by request_id', fakeAsync(() => {
      chatManagerStub.conversationsHandlerService.getConversationDetail.and.callFake((id: string, cb: any) => cb(null));
      chatManagerStub.archivedConversationsService.getConversationDetail.and.callFake((id: string, cb: any) => cb(null));
      tiledeskStub.getMyRequests.and.resolveTo({
        requests: [{ request_id: component.conversationId }],
      });
      let result: boolean | null = null;
      component.getConversationDetail().then((r) => (result = r));
      tick();
      expect(result).toBe(false);
    }));
  });

  describe('emitter handlers', () => {
    it('onBackHomeFN emits', () => {
      spyOn(component.onBackHome, 'emit');
      component.onBackHomeFN();
      expect(component.onBackHome.emit).toHaveBeenCalled();
    });

    it('onSoundChangeFN emits', () => {
      spyOn(component.onSoundChange, 'emit');
      component.onSoundChangeFN(true);
      expect(component.onSoundChange.emit).toHaveBeenCalledWith(true);
    });

    it('onMenuOptionClick LOGOUT emits signOut', () => {
      spyOn(component.onSignOut, 'emit');
      component.onMenuOptionClick(HEADER_MENU_OPTION.LOGOUT);
      expect(component.onSignOut.emit).toHaveBeenCalledWith(true);
    });

    it('onMenuOptionClick VOLUME emits sound', () => {
      spyOn(component.onSoundChange, 'emit');
      component.onMenuOptionClick(HEADER_MENU_OPTION.VOLUME_ON);
      component.onMenuOptionClick(HEADER_MENU_OPTION.VOLUME_OFF);
      expect(component.onSoundChange.emit).toHaveBeenCalledWith(true);
      expect(component.onSoundChange.emit).toHaveBeenCalledWith(false);
    });

    it('onMenuOptionClick CLOSE opens dialog', () => {
      component.conversation = { uid: 'c1' } as any;
      component.onMenuOptionClick(HEADER_MENU_OPTION.CLOSE);
      expect(component.mydialog.nativeElement.showModal).toHaveBeenCalled();
    });

    it('onMenuOptionClick RESTART sends /start', () => {
      component.onMenuOptionClick(HEADER_MENU_OPTION.RESTART);
      expect(component.conversationFooter.sendMessage).toHaveBeenCalled();
    });
  });

  describe('onCloseDialog', () => {
    it('back closes modal', () => {
      component.onCloseDialog({ type: 'back', data: null });
      expect(component.mydialog.nativeElement.close).toHaveBeenCalled();
    });

    it('confirm resolves closeSupportGroup success', fakeAsync(() => {
      component.conversationId = 'cid';
      component.onCloseDialog({ type: 'confirm', data: null });
      tick();
      expect(tiledeskStub.closeSupportGroup).toHaveBeenCalledWith('cid');
      expect(component.mydialog.nativeElement.close).toHaveBeenCalled();
    }));

    it('confirm logs on close failure', fakeAsync(() => {
      tiledeskStub.closeSupportGroup.and.returnValue(Promise.reject('e'));
      component.onCloseDialog({ type: 'confirm', data: null });
      tick();
      expect(component).toBeTruthy();
    }));
  });

  describe('newMessageAdded', () => {
    it('should scroll for own messages', fakeAsync(() => {
      const msg = { sender: 'visitor-1', timestamp: Date.now() } as MessageModel;
      component.senderId = 'visitor-1';
      component.newMessageAdded(msg);
      tick(250);
      expect(component.conversationContent.scrollToBottom).toHaveBeenCalled();
    }));

    it('should increment badge when scrolled up', () => {
      component.senderId = 'visitor-1';
      component.conversationContent = {
        ...component.conversationContent,
        checkContentScrollPosition: jasmine.createSpy('chk').and.returnValue(false),
      } as any;
      const msg = { sender: 'agent', attributes: {}, timestamp: Date.now() } as MessageModel;
      const before = component.messagesBadgeCount;
      component.newMessageAdded(msg);
      expect(component.messagesBadgeCount).toBe(before + 1);
    });
  });

  describe('onScrollContent', () => {
    it('should reset badge when reaching bottom', () => {
      component.messagesBadgeCount = 3;
      component.onScrollContent(true);
      expect(component.messagesBadgeCount).toBe(0);
    });
  });

  describe('onAfterSendMessageFN', () => {
    it('should set thinking for own messages', () => {
      spyOn(component.onAfterSendMessage, 'emit');
      const msg = { sender: 'visitor-1' } as MessageModel;
      component.senderId = 'visitor-1';
      component.onAfterSendMessageFN(msg);
      expect(component.showThinkingMessage).toBe(true);
    });
  });

  describe('drop / allowDrop / drag', () => {
    it('allowDrop sets hovering', () => {
      const ev = { preventDefault: jasmine.createSpy(), stopPropagation: jasmine.createSpy() } as any;
      component.allowDrop(ev);
      expect(component.isHovering).toBe(true);
    });

    it('drop stores dropEvent when files present', () => {
      const file = new File(['b'], 'b.txt');
      const dt = new DataTransfer();
      dt.items.add(file);
      const ev: any = {
        preventDefault: jasmine.createSpy(),
        stopPropagation: jasmine.createSpy(),
        dataTransfer: { files: dt.files },
      };
      component.drop(ev);
      expect(component.dropEvent).toBe(ev);
    });
  });

  describe('unsubscribe()', () => {
    it('clears subscription entries', () => {
      component.conversationHandlerService = conversationHandlerMock as any;
      (component as any).typingService = TestBed.inject(TypingService);
      component.subscriptions = [];
      component.unsubscribe();
      expect(component.subscriptions.length).toBe(0);
    });
  });

  describe('lead / user info updates (visitor profile)', () => {
    it('updateLeadInfo should persist fullname/email to Globals and storage', () => {
      const storage = TestBed.inject(AppStorageService);
      const msg = {
        attributes: { updateUserFullname: 'Jane', updateUserEmail: 'jane@example.com' },
      } as MessageModel;
      component.updateLeadInfo(msg);
      expect((globals as any).userFullname).toContain('Jane');
      expect(storage.setItem).toHaveBeenCalled();
    });

    it('updateUserInfo should copy customAttributes onto Globals', () => {
      component.updateUserInfo({ userFullname: 'Bob', userEmail: 'bob@example.com' });
      expect((globals as any).userFullname).toBe('Bob');
    });
  });

  describe('onAttachmentButtonClicked', () => {
    beforeEach(() => {
      component.conversationFooter = {
        sendMessage: jasmine.createSpy('sendMessage'),
      } as any;
    });

    it('should return early when payload is incomplete', () => {
      component.onAttachmentButtonClicked(null);
      expect(component.conversationFooter.sendMessage).not.toHaveBeenCalled();
    });

    it('should send text button value', () => {
      component.onAttachmentButtonClicked({
        target: { type: 'text', button: { value: 'OK' } },
      });
      expect(component.conversationFooter.sendMessage).toHaveBeenCalled();
    });
  });

  describe('onWidgetSizeChange', () => {
    it('should short-circuit when mobile', () => {
      (globals as any).isMobile = true;
      component.onWidgetSizeChange('min');
      expect(globals.fullscreenMode).toBe(true);
      (globals as any).isMobile = false;
    });

    it('should persist size and toggle classes when tiledeskdiv exists', () => {
      const storage = TestBed.inject(AppStorageService);
      const tiledeskDiv = document.createElement('div');
      tiledeskDiv.id = 'tiledeskdiv';
      const parent = document.createElement('div');
      parent.appendChild(tiledeskDiv);
      document.body.appendChild(parent);
      (globals as any).windowContext = {
        window: { document: { getElementById: (id: string) => (id === 'tiledeskdiv' ? tiledeskDiv : null) } },
      };
      (globals as any).isMobile = false;
      (globals as any).align = 'right';
      (globals as any).marginX = '10px';
      (globals as any).marginY = '10px';
      (globals as any).mobileMarginX = '5px';
      (globals as any).mobileMarginY = '5px';

      component.onWidgetSizeChange('max');
      expect(tiledeskDiv.classList.contains('max-size')).toBe(true);
      expect(storage.setItem).toHaveBeenCalled();

      component.onWidgetSizeChange('top');
      expect(parent.classList.contains('overlay--popup')).toBe(true);

      document.body.removeChild(parent);
    });
  });

  describe('skipToCompose', () => {
    it('should focus composer when textarea exists', () => {
      const ta = document.createElement('textarea');
      ta.id = 'chat21-main-message-context';
      document.body.appendChild(ta);
      spyOn(ta, 'focus');
      component.skipToCompose();
      expect(ta.focus).toHaveBeenCalled();
      document.body.removeChild(ta);
    });
  });

  describe('header / widget chrome handlers', () => {
    it('onCloseWidgetFN should strip size classes and emit', () => {
      spyOn(component.onCloseWidget, 'emit');
      const tiledeskDiv = document.createElement('div');
      tiledeskDiv.classList.add('max-size', 'min-size');
      (globals as any).windowContext = {
        window: { document: { getElementById: () => tiledeskDiv } },
      };
      component.onCloseWidgetFN();
      expect(component.onCloseWidget.emit).toHaveBeenCalled();
      expect(tiledeskDiv.classList.contains('max-size')).toBe(false);
      expect(tiledeskDiv.classList.contains('min-size')).toBe(false);
    });

    it('onCloseChat should open dialog', () => {
      component.conversation = { uid: 'c1' } as any;
      component.onCloseChat();
      expect(component.mydialog.nativeElement.showModal).toHaveBeenCalled();
      expect(component.isMenuShow).toBe(false);
    });

    it('onRestartChat should send /start with attributes', () => {
      (globals as any).attributes = { k: 'v' };
      component.onRestartChat();
      expect(component.conversationFooter.sendMessage).toHaveBeenCalled();
      const args = (component.conversationFooter.sendMessage as jasmine.Spy).calls.mostRecent().args;
      expect(args[0]).toBe('/start');
    });

    it('onMenuOptionClick should route MAXIMIZE and MINIMIZE', () => {
      spyOn(component, 'onWidgetSizeChange');
      component.onMenuOptionClick(HEADER_MENU_OPTION.MAXIMIZE);
      component.onMenuOptionClick(HEADER_MENU_OPTION.MINIMIZE);
      expect(component.onWidgetSizeChange).toHaveBeenCalledWith('max');
      expect(component.onWidgetSizeChange).toHaveBeenCalledWith('min');
    });

    it('onMenuOption should update visibility and blur composer', () => {
      component.onMenuOption(false);
      expect(component.isMenuShow).toBe(false);
      expect(component.conversationFooter.removeFocusOnId).toHaveBeenCalledWith('chat21-main-message-context');
    });
  });

  describe('content and preview bridges', () => {
    it('onBeforeMessageRenderFN and onAfterMessageRenderFN should emit', () => {
      spyOn(component.onBeforeMessageRender, 'emit');
      spyOn(component.onAfterMessageRender, 'emit');
      component.onBeforeMessageRenderFN({ a: 1 });
      component.onAfterMessageRenderFN({ b: 2 });
      expect(component.onBeforeMessageRender.emit).toHaveBeenCalledWith({ a: 1 });
      expect(component.onAfterMessageRender.emit).toHaveBeenCalledWith({ b: 2 });
    });

    it('onAttachmentButtonClicked url should call openLink', () => {
      spyOn(component as any, 'openLink');
      component.onAttachmentButtonClicked({ target: { type: 'url', button: { href: 'x' } } });
      expect((component as any).openLink).toHaveBeenCalled();
    });

    it('onAttachmentButtonClicked action should call actionButton', () => {
      spyOn(component as any, 'actionButton');
      component.onAttachmentButtonClicked({ target: { type: 'action', button: {} } });
      expect((component as any).actionButton).toHaveBeenCalled();
    });

    it('onScrollContent false should show scroll-to-bottom affordance', () => {
      component.onScrollContent(false);
      expect(component.showBadgeScroollToBottom).toBe(true);
    });

    it('onOpenExternalFrame should open window', () => {
      spyOn(window, 'open');
      component.onOpenExternalFrame({ link: 'https://ex.example' });
      expect(window.open).toHaveBeenCalledWith('https://ex.example', '_blank');
    });

    it('onCloseInternalFrame should clear button state', () => {
      spyOn(component as any, 'restoreDefaultWidgetSize').and.stub();
      component.isButtonUrl = true;
      component.buttonClicked = { x: 1 } as any;
      component.onCloseInternalFrame({});
      expect(component.isButtonUrl).toBe(false);
      expect(component.buttonClicked).toBeNull();
    });

    it('onSendAttachment should close preview and call uploadSingle', () => {
      component.isOpenAttachmentPreview = true;
      component.attachments = [{ metadata: { uid: '1' }, file: new File([], 'a.png') }] as any;
      component.conversationFooter.uploadSingle = jasmine.createSpy('uploadSingle');
      component.onSendAttachment('cap');
      expect(component.isOpenAttachmentPreview).toBe(false);
      expect(component.conversationFooter.uploadSingle).toHaveBeenCalled();
    });

    it('onCloseModalPreview should reset footer upload flag', () => {
      component.isOpenAttachmentPreview = true;
      (component.conversationFooter as any).isFilePendingToUpload = true;
      component.onCloseModalPreview();
      expect(component.isOpenAttachmentPreview).toBe(false);
      expect((component.conversationFooter as any).isFilePendingToUpload).toBe(false);
    });

    it('onEmojiiPickerShow should mirror state', () => {
      component.onEmojiiPickerShow(true);
      expect(component.isEmojiiPickerShow).toBe(true);
    });

    it('onBeforeMessangeSentFN should emit', () => {
      spyOn(component.onBeforeMessageSent, 'emit');
      const m = { uid: 'm' } as MessageModel;
      component.onBeforeMessangeSentFN(m);
      expect(component.onBeforeMessageSent.emit).toHaveBeenCalledWith(m);
    });

    it('onChangeTextArea should resize scroll host for medium heights', () => {
      const scrollHost = component.conversationContent.scrollMe.nativeElement;
      component.onChangeTextArea({
        textAreaEl: { style: { height: '40px' } },
      } as any);
      expect(scrollHost.style.height).toContain('calc');
    });

    it('onAttachmentFileButtonClicked should open preview', () => {
      const ev = { attachments: [{ f: 1 }], message: 'm' };
      component.onAttachmentFileButtonClicked(ev as any);
      expect(component.isOpenAttachmentPreview).toBe(true);
      expect(component.attachments as any).toEqual([{ f: 1 }]);
      expect(component.textInputTextArea).toBe('m');
    });

    it('onNewConversationButtonClickedFN should emit', () => {
      spyOn(component.onNewConversationButtonClicked, 'emit');
      component.onNewConversationButtonClickedFN(null);
      expect(component.onNewConversationButtonClicked.emit).toHaveBeenCalled();
    });
  });
});
