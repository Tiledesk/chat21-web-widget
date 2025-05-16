import { TiledeskRequestsService } from './../../../../chat21-core/providers/tiledesk/tiledesk-requests.service';
import { StarRatingWidgetService } from './../../../providers/star-rating-widget.service';
import { StarRatingWidgetComponent } from './../../star-rating-widget/star-rating-widget.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { Triggerhandler } from './../../../../chat21-core/utils/triggerHandler';
import { AppComponent } from './../../../app.component';
import { AppConfigService } from './../../../providers/app-config.service';

import { Globals } from './../../../utils/globals';
import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationComponent } from './conversation.component';
import { GlobalSettingsService } from '../../../providers/global-settings.service';
import { SettingsSaverService } from '../../../providers/settings-saver.service';
import { TranslatorService } from '../../../providers/translator.service';

import { AppStorageService } from '../../../../chat21-core/providers/abstract/app-storage.service';

import { CustomTranslateService } from '../../../../chat21-core/providers/custom-translate.service';
import { MessagingAuthService } from '../../../../chat21-core/providers/abstract/messagingAuth.service';
import { TiledeskAuthService } from '../../../../chat21-core/providers/tiledesk/tiledesk-auth.service';
import { PresenceService } from '../../../../chat21-core/providers/abstract/presence.service';
import { ConversationsHandlerService } from '../../../../chat21-core/providers/abstract/conversations-handler.service';
import { ArchivedConversationsHandlerService } from '../../../../chat21-core/providers/abstract/archivedconversations-handler.service';
import { ConversationHandlerBuilderService } from '../../../../chat21-core/providers/abstract/conversation-handler-builder.service';
import { ChatManager } from '../../../../chat21-core/providers/chat-manager';
import { TypingService } from '../../../../chat21-core/providers/abstract/typing.service';
import { ImageRepoService } from '../../../../chat21-core/providers/abstract/image-repo.service';
import { UploadService } from '../../../../chat21-core/providers/abstract/upload.service';
import { TranslateModule } from '@ngx-translate/core';
import { NGXLogger } from 'ngx-logger';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';

describe('ConversationComponent', () => {
  let component: ConversationComponent;
  let fixture: ComponentFixture<ConversationComponent>;
  let ngxlogger: NGXLogger;
  let customLogger = new CustomLogger(ngxlogger)
  class MockElementRef {}

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConversationComponent ],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        Globals,
        AppConfigService,
        AppComponent,
        { provide: ElementRef, useClass: MockElementRef },
        GlobalSettingsService,
        SettingsSaverService,
        Triggerhandler,
        TranslatorService,
        AppConfigService,
        AppStorageService,
        CustomTranslateService,
        MessagingAuthService,
        TiledeskAuthService,
        PresenceService,
        ConversationsHandlerService,
        ArchivedConversationsHandlerService,
        ConversationHandlerBuilderService,
        ChatManager,
        TypingService,
        ImageRepoService,
        UploadService,
        StarRatingWidgetService,
        TiledeskRequestsService,
        NGXLogger
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationComponent);
    component = fixture.componentInstance;
    LoggerInstance.setInstance(customLogger)
    let logger = LoggerInstance.getInstance()
    component['logger']= logger
    let globals  = fixture.debugElement.injector.get(Globals) as Globals;
    globals.initDefafultParameters()
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
