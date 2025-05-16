import { CustomTranslateService } from './../../../chat21-core/providers/custom-translate.service';
import { NO_ERRORS_SCHEMA, IterableDiffers, IterableDifferFactory } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Globals } from '../../utils/globals';

import { ListAllConversationsComponent } from './list-all-conversations.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NGXLogger } from 'ngx-logger';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';

describe('ListAllConversationsComponent', () => {
  let component: ListAllConversationsComponent;
  let fixture: ComponentFixture<ListAllConversationsComponent>;
  let ngxlogger: NGXLogger;
  let customLogger = new CustomLogger(ngxlogger)
  
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListAllConversationsComponent ],
      imports: [
        TranslateModule.forRoot(),
      ],
      providers: [
        Globals,
        IterableDiffers,
        CustomTranslateService,
        TranslateService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListAllConversationsComponent);
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
