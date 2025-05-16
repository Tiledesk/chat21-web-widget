import { DomSanitizer } from '@angular/platform-browser';
import { LoggerInstance } from './../../../../chat21-core/providers/logger/loggerInstance';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationPreviewComponent } from './conversation-preview.component';
import { LogLevel } from 'src/chat21-core/utils/constants';
import { NGXLogger } from 'ngx-logger';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
const mockService = jasmine.createSpyObj('LoggerService', ['setLoggerConfig', "debug", "log", "warn", "info", "error" ]);

describe('ConversationPreviewComponent', () => {
  let component: ConversationPreviewComponent;
  let fixture: ComponentFixture<ConversationPreviewComponent>;
  let ngxlogger: NGXLogger;
  let customLogger = new CustomLogger(ngxlogger)

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConversationPreviewComponent ],
      providers: [LoggerService]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationPreviewComponent);
    component = fixture.componentInstance;
    LoggerInstance.setInstance(customLogger)
    let logger = LoggerInstance.getInstance()
    component['logger']= logger
    fixture.detectChanges();
  });

  it('should create', () => {
    console.log('ConversationPreviewComponent --->', component)
    expect(component).toBeTruthy();
  });
});
