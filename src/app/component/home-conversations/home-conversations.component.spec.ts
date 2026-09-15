import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subscription } from 'rxjs';

import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';
import { TranslatorService } from 'src/app/providers/translator.service';
import { ChatManager } from 'src/chat21-core/providers/chat-manager';
import { ImageRepoService } from 'src/chat21-core/providers/abstract/image-repo.service';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { ConversationModel } from 'src/chat21-core/models/conversation';
import { UserAgent } from 'src/models/userAgent';

import { WaitingService } from 'src/app/providers/waiting.service';
import { Globals } from '../../utils/globals';
import { HomeConversationsComponent } from './home-conversations.component';

describe('HomeConversationsComponent', () => {
  let component: HomeConversationsComponent;
  let fixture: ComponentFixture<HomeConversationsComponent>;
  let globals: Globals;
  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);

  const waitingStub = {
    getCurrent: jasmine.createSpy('getCurrent').and.returnValue(of([{ waiting_time_avg: 45000 }])),
  };

  const imageRepoStub = {
    getImagePhotoUrl: jasmine.createSpy('getImagePhotoUrl').and.returnValue('https://cdn.example/photo.png'),
    checkImageExists: jasmine.createSpy('checkImageExists'),
  };

  const translateStub = {
    translateLanguage: jasmine.createSpy('translateLanguage').and.callFake((keys: string[]) => {
      const m = new Map<string, string>();
      keys.forEach((k) => m.set(k, `T:${k}`));
      return m;
    }),
  };

  beforeEach(waitForAsync(() => {
    LoggerInstance.setInstance(new CustomLogger(ngxlogger));
    TestBed.configureTestingModule({
      declarations: [HomeConversationsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        Globals,
        { provide: ImageRepoService, useValue: imageRepoStub },
        { provide: ChatManager, useValue: {} },
        { provide: TranslatorService, useValue: { getLanguage: () => 'en' } },
        { provide: CustomTranslateService, useValue: translateStub },
        { provide: WaitingService, useValue: waitingStub },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    globals = TestBed.inject(Globals);
    globals.initDefafultParameters();
    globals.projectid = 'proj-1';
    globals.WAITING_TIME_FOUND = 'Tempo stimato $reply_time';
    globals.dynamicWaitTimeReply = true;
    globals.showWaitTime = true;
    globals.PREV_CONVERSATIONS = 'Le tue conversazioni';
    globals.NO_CONVERSATION = 'Nessuna';
    globals.SHOW_ALL_CONV = 'Vedi tutte';
    globals.LABEL_START_NW_CONV = 'Nuova';
    globals.themeColor = '#00f';
    globals.themeForegroundColor = '#fff';
    globals.showAllConversations = true;
    globals.showAvailableAgents = false;
    globals.availableAgents = [{ id: 'a1', firstname: 'Ada', imageurl: '' } as UserAgent];

    fixture = TestBed.createComponent(HomeConversationsComponent);
    component = fixture.componentInstance;
    component.stylesMap = new Map();
    component.listConversations = [];
    component.archivedConversations = [];
    component.hideNewConversationButton = false;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialize and waiting time', () => {
    it('should load translations and agent image URLs', () => {
      expect(translateStub.translateLanguage).toHaveBeenCalled();
      expect(imageRepoStub.getImagePhotoUrl).toHaveBeenCalledWith('a1');
      expect(component.availableAgents.length).toBe(1);
    });

    it('should set waitingTime and placeholder when API returns averages', fakeAsync(() => {
      tick(0);
      expect(waitingStub.getCurrent).toHaveBeenCalledWith('proj-1');
      expect(component.waitingTime).toBe(45000);
      expect(component.humanWaitingTime).toBeTruthy();
      expect(component.WAITING_TIME_FOUND_WITH_REPLYTIME_PLACEHOLDER).toContain(component.humanWaitingTime);
    }));

    it('should render root container id', () => {
      const root = fixture.debugElement.query(By.css('#c21-app-list-conversations'));
      expect(root).toBeTruthy();
    });
  });

  /** Allineato a twp/index + tiledesk_open: lista vuota, CTA primaria, footer tempo attesa */
  describe('empty state UI (widget integration)', () => {
    beforeEach(() => {
      globals.NO_CONVERSATION = 'Nessuna conversazione attiva';
      globals.LABEL_START_NW_CONV = 'Nuova conversazione';
      globals.showAvailableAgents = false;
      globals.availableAgents = [{ id: 'solo', firstname: 'Ada', imageurl: 'https://cdn.example/photo.png' } as UserAgent];
      component.listConversations = [];
      component.archivedConversations = [];
      fixture.detectChanges();
    });

    it('should show NO_CONVERSATION title in header when both lists are empty', () => {
      const titleEl = fixture.nativeElement.querySelector('.c21-header .c21-title') as HTMLElement;
      expect(titleEl.textContent?.trim()).toBe('Nessuna conversazione attiva');
    });

    it('should render primary new-conversation button with theme label and paper-plane icon', () => {
      const btn = fixture.nativeElement.querySelector('.c21-new-conversation .c21-button-primary') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.getAttribute('aria-label')).toBe('Nuova conversazione');
      expect(btn.textContent).toContain('Nuova conversazione');
      expect(btn.querySelector('svg')).toBeTruthy();
    });

    it('should surface waiting footer copy when showWaitTime and API returned average', fakeAsync(() => {
      tick(0);
      fixture.detectChanges();
      const footer = fixture.nativeElement.querySelector('.c21-footer .c21-waiting-time') as HTMLElement;
      expect(footer).toBeTruthy();
      expect(footer.textContent).toContain(component.humanWaitingTime);
    }));
  });

  describe('checkShowAllConversation', () => {
    it('should return true when archived list has items', () => {
      component.archivedConversations = [{ uid: 'x' } as ConversationModel];
      expect(component.checkShowAllConversation()).toBe(true);
    });

    it('should return true when active list has items', () => {
      component.archivedConversations = [];
      component.listConversations = [{ uid: 'y' } as ConversationModel];
      expect(component.checkShowAllConversation()).toBe(true);
    });

    it('should return false when both lists are empty', () => {
      component.archivedConversations = [];
      component.listConversations = [];
      expect(component.checkShowAllConversation()).toBe(false);
    });
  });

  describe('outputs and selection', () => {
    it('openNewConversation should emit onNewConversation', () => {
      spyOn(component.onNewConversation, 'emit');
      component.openNewConversation();
      expect(component.onNewConversation.emit).toHaveBeenCalled();
    });

    it('returnOpenAllConversation should emit onOpenAllConvesations', () => {
      spyOn(component.onOpenAllConvesations, 'emit');
      component.returnOpenAllConversation();
      expect(component.onOpenAllConvesations.emit).toHaveBeenCalled();
    });

    it('onConversationSelectedFN should emit when conversation is defined', () => {
      spyOn(component.onConversationSelected, 'emit');
      const c = { uid: 'c1' } as ConversationModel;
      component.onConversationSelectedFN(c);
      expect(component.onConversationSelected.emit).toHaveBeenCalledWith(c);
    });

    it('onConversationSelectedFN should not emit for falsy conversation', () => {
      spyOn(component.onConversationSelected, 'emit');
      component.onConversationSelectedFN(null as any);
      expect(component.onConversationSelected.emit).not.toHaveBeenCalled();
    });

    it('onImageLoadedFN / onConversationLoadedFN should forward', () => {
      spyOn(component.onImageLoaded, 'emit');
      spyOn(component.onConversationLoaded, 'emit');
      const c = { uid: 'z' } as ConversationModel;
      component.onImageLoadedFN(c);
      component.onConversationLoadedFN(c);
      expect(component.onImageLoaded.emit).toHaveBeenCalledWith(c);
      expect(component.onConversationLoaded.emit).toHaveBeenCalledWith(c);
    });
  });

  describe('agent image map', () => {
    it('isImageLoaded should be false without url or before load', () => {
      const agent = { id: 'x2', firstname: 'B', imageurl: '' } as UserAgent;
      expect(component.isImageLoaded(agent)).toBe(false);
    });

    it('onImageLoad should mark agent as loaded', () => {
      const agent = { id: 'x3', imageurl: 'https://x' } as UserAgent;
      component.onImageLoad(agent);
      expect(component.isImageLoaded(agent)).toBe(true);
    });

    it('onImageError should mark agent as not loaded', () => {
      const agent = { id: 'x4', imageurl: 'https://x' } as UserAgent;
      component.onImageError(agent);
      expect(component.imageLoadedMap.get('x4')).toBe(false);
    });
  });

  describe('ngOnDestroy and unsubscribe', () => {
    it('unsubscribe should clear subscription list', () => {
      const sub = new Subscription();
      spyOn(sub, 'unsubscribe');
      component.subscriptions.push(sub);
      component.unsubscribe();
      expect(sub.unsubscribe).toHaveBeenCalled();
      expect(component.subscriptions.length).toBe(0);
    });

    it('ngOnDestroy should call unsubscribe', () => {
      spyOn(component, 'unsubscribe');
      component.ngOnDestroy();
      expect(component.unsubscribe).toHaveBeenCalled();
    });
  });
});
