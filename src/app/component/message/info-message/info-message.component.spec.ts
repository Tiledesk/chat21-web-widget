import { CustomLogger } from './../../../../chat21-core/providers/logger/customLogger';
import { LoggerInstance } from './../../../../chat21-core/providers/logger/loggerInstance';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkedPipe } from '../../../pipe/marked.pipe';

import { InfoMessageComponent } from './info-message.component';
import { NGXLogger } from 'ngx-logger';

describe('InfoMessageComponent', () => {
  let component: InfoMessageComponent;
  let fixture: ComponentFixture<InfoMessageComponent>;
  let ngxlogger: NGXLogger;
  let customLogger = new CustomLogger(ngxlogger)

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InfoMessageComponent, MarkedPipe ],
      providers: [LoggerService, NGXLogger]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoMessageComponent);
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
