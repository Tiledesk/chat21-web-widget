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
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { of } from 'rxjs';
 
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
        provideHttpClient(withInterceptorsFromDi()),
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
