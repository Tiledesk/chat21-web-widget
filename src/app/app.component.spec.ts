import { Triggerhandler } from './../chat21-core/utils/triggerHandler';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { GlobalSettingsService } from './providers/global-settings.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
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
import { NGXLogger } from 'ngx-logger';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
 
describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let ngxlogger: NGXLogger;
  let customLogger = new CustomLogger(ngxlogger)
  
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers:[
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
        UploadService
      ],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    LoggerInstance.setInstance(customLogger)
    let logger = LoggerInstance.getInstance()
    component['logger']= logger
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
