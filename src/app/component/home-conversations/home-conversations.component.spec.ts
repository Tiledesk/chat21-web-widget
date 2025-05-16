import { CustomTranslateService } from './../../../chat21-core/providers/custom-translate.service';
import { TranslatorService } from './../../providers/translator.service';
import { HttpClientModule } from '@angular/common/http';
import { AppConfigService } from './../../providers/app-config.service';
import { WaitingService } from './../../providers/waiting.service';
import { ChatManager } from './../../../chat21-core/providers/chat-manager';
import { Globals } from './../../utils/globals';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeConversationsComponent } from './home-conversations.component';
import { ImageRepoService } from '../../../chat21-core/providers/abstract/image-repo.service';
import { ConversationsHandlerService } from '../../../chat21-core/providers/abstract/conversations-handler.service';
import { ArchivedConversationsHandlerService } from '../../../chat21-core/providers/abstract/archivedconversations-handler.service';
import { TranslateModule } from '@ngx-translate/core';
import { NGXLogger } from 'ngx-logger';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';

describe('HomeConversationsComponent', () => {
  let component: HomeConversationsComponent;
  let fixture: ComponentFixture<HomeConversationsComponent>;
  let ngxlogger: NGXLogger;
  let customLogger = new CustomLogger(ngxlogger)
  
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeConversationsComponent ],
      imports: [
        HttpClientModule,
        TranslateModule.forRoot()
      ],
      providers: [
        Globals,
        ImageRepoService,
        ChatManager,
        ConversationsHandlerService,
        ArchivedConversationsHandlerService,
        WaitingService,
        AppConfigService,
        TranslatorService,
        CustomTranslateService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeConversationsComponent);
    component = fixture.componentInstance;
    LoggerInstance.setInstance(customLogger)
    let logger = LoggerInstance.getInstance()
    component['logger']= logger
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
