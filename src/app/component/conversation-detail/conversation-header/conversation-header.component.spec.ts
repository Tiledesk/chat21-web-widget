import { HttpClientModule } from '@angular/common/http';
import { AppConfigService } from './../../../providers/app-config.service';
import { Globals } from './../../../utils/globals';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConversationHeaderComponent } from './conversation-header.component';
import { TypingService } from '../../../../chat21-core/providers/abstract/typing.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { NGXLogger } from 'ngx-logger';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';

describe('ConversationHeaderComponent', () => {
  let component: ConversationHeaderComponent;
  let fixture: ComponentFixture<ConversationHeaderComponent>;
  let ngxlogger: NGXLogger;
  let customLogger = new CustomLogger(ngxlogger)
  
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConversationHeaderComponent ],
      imports: [
        HttpClientModule
      ],
      providers: [ 
        Globals,
        TypingService,
        AppConfigService
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationHeaderComponent);
    component = fixture.componentInstance;
    LoggerInstance.setInstance(customLogger)
    let logger = LoggerInstance.getInstance()
    component['logger']= logger
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
