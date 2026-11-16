import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Triggerhandler } from './../chat21-core/utils/triggerHandler';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { GlobalSettingsService } from './providers/global-settings.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppStorageService } from 'src/chat21-core/providers/abstract/app-storage.service';
import { TranslatorService } from './providers/translator.service';
import { TranslateModule } from '@ngx-translate/core';
import { CustomTranslateService } from '../chat21-core/providers/custom-translate.service';
import { ConversationsHandlerService } from '../chat21-core/providers/abstract/conversations-handler.service';
import { ArchivedConversationsHandlerService } from '../chat21-core/providers/abstract/archivedconversations-handler.service';
import { TiledeskRequestsService } from 'src/chat21-core/providers/tiledesk/tiledesk-requests.service';
import { TiledeskAuthService } from 'src/chat21-core/providers/tiledesk/tiledesk-auth.service';
import { MessagingAuthService } from 'src/chat21-core/providers/abstract/messagingAuth.service';
import { ConversationHandlerBuilderService } from 'src/chat21-core/providers/abstract/conversation-handler-builder.service';
import { ImageRepoService } from 'src/chat21-core/providers/abstract/image-repo.service';
import { TypingService } from 'src/chat21-core/providers/abstract/typing.service';
import { PresenceService } from 'src/chat21-core/providers/abstract/presence.service';
import { UploadService } from 'src/chat21-core/providers/abstract/upload.service';
import { AppConfigService } from './providers/app-config.service';
import { ChatManager } from 'src/chat21-core/providers/chat-manager';
import { Globals } from './utils/globals';


import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { of } from 'rxjs';
import { LocalSessionStorage } from 'src/chat21-core/providers/localSessionStorage';
import { UserModel } from 'src/chat21-core/models/user';
 
describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
  const customLogger = new CustomLogger(ngxlogger);
  
  beforeEach(waitForAsync(() => {
    LoggerInstance.setInstance(customLogger);
    spyOn(AppComponent.prototype, 'ngAfterViewInit').and.stub();
    TestBed.configureTestingModule({
    declarations: [
        AppComponent
    ],
    imports: [RouterTestingModule,
        TranslateModule.forRoot()],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        Globals,
        Triggerhandler,
        GlobalSettingsService,
        AppStorageService,
        AppConfigService,
        TranslatorService,
        CustomTranslateService,
        ChatManager,
        ConversationsHandlerService,
        ConversationHandlerBuilderService,
        ArchivedConversationsHandlerService,
        TiledeskRequestsService,
        TiledeskAuthService,
        MessagingAuthService,
        ImageRepoService,
        TypingService,
        PresenceService,
        UploadService,
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
}).compileComponents();
  }));

  beforeEach(() => {
    spyOn(TestBed.inject(GlobalSettingsService), 'getProjectParametersById').and.returnValue(
      of({ project: null }) as any,
    );
    spyOn(TestBed.inject(GlobalSettingsService), 'manageLoadingDomains').and.returnValue(true);

    const translator = TestBed.inject(TranslatorService);
    spyOn(translator, 'initI18n').and.returnValue(Promise.resolve(undefined));
    spyOn(translator, 'translate').and.stub();
    spyOn(translator, 'getLanguage').and.returnValue('en');

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  describe('recipientId ownership', () => {
    let storage: LocalSessionStorage;
    let tiledeskAuthService: TiledeskAuthService;
    const guestB = { uid: 'user-B', firstname: 'Guest', lastname: '', email: '' } as UserModel;

    beforeEach(() => {
      localStorage.clear();
      storage = new LocalSessionStorage();
      storage.initialize('widget_sv5', 'local', 'proj-123');
      (component as any).appStorageService = storage;
      storage.setItem('recipientId', 'support-group-proj-123-of-A');
      storage.setItem('recipientIdOwner', 'user-A');
      component.g.recipientId = 'support-group-proj-123-of-A';
      component.g.attributes = {};

      tiledeskAuthService = TestBed.inject(TiledeskAuthService);
      spyOn(tiledeskAuthService, 'signInAnonymously').and.returnValue(Promise.resolve('JWT token-B'));
      spyOn(tiledeskAuthService, 'getCurrentUser').and.returnValue(guestB);
      component.messagingAuthService = jasmine.createSpyObj('MessagingAuthService', ['createCustomToken']);
      component.chatManager.initialize();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('window.Tiledesk("signInAnonymous") removes recipientId and recipientIdOwner', async () => {
      await (component as any).signInAnonymous();
      expect(storage.getItem('recipientId')).toBeNull();
      expect(storage.getItem('recipientIdOwner')).toBeNull();
      expect(component.g.recipientId).toBeNull();
    });

    it('authenticate() without a token signs in anonymously and removes recipientId and recipientIdOwner', async () => {
      component.g.tiledeskToken = null;
      (component as any).authenticate();
      await Promise.resolve();
      await Promise.resolve();
      expect(tiledeskAuthService.signInAnonymously).toHaveBeenCalled();
      expect(storage.getItem('recipientId')).toBeNull();
      expect(storage.getItem('recipientIdOwner')).toBeNull();
      expect(component.g.recipientId).toBeNull();
    });

    it('startUI() does not reopen a conversation stored by another user', () => {
      component.g.recipientId = null;
      component.g.singleConversation = false;
      component.g.departments = [];
      spyOn(component as any, 'triggerOnViewInit').and.stub();
      spyOn(component.g, 'setParentBodyStyleMobile').and.stub();
      spyOn(component.g, 'setElementStyle').and.stub();
      (component as any).startUI();
      expect(component.g.recipientId).not.toBe('support-group-proj-123-of-A');
      expect(storage.getItem('recipientId')).not.toBe('support-group-proj-123-of-A');
    });
  });

  // it(`should have as title 'widget'`, () => {
  //   expect(component.title).toEqual('widget');
  // });

  // it('should render title in a h1 tag', () => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   fixture.detectChanges();
  //   const compiled = fixture.debugElement.nativeElement;
  //   expect(compiled.querySelector('h1').textContent).toContain('Welcome to widget!');
  // });
});
