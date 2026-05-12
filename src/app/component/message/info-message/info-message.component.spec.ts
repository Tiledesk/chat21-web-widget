import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageModel } from 'src/chat21-core/models/message';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { NGXLogger } from 'ngx-logger';
import { TooltipDirective } from '../../../directives/tooltip.directive';
import { DateAgoPipe } from '../../../pipe/date-ago.pipe';
import { MarkedPipe } from '../../../pipe/marked.pipe';
import { InfoMessageComponent } from './info-message.component';

describe('InfoMessageComponent', () => {
  let component: InfoMessageComponent;
  let fixture: ComponentFixture<InfoMessageComponent>;
  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
  const customLogger = new CustomLogger(ngxlogger);

  beforeEach(waitForAsync(() => {
    LoggerInstance.setInstance(customLogger);
    TestBed.configureTestingModule({
      declarations: [InfoMessageComponent, MarkedPipe, DateAgoPipe, TooltipDirective],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoMessageComponent);
    component = fixture.componentInstance;
    component.message = { text: 'hello', timestamp: Date.now() } as MessageModel;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should replace br tags with newlines in message text', () => {
    const msg = { text: 'a<br/>b<br>c', timestamp: Date.now() } as MessageModel;
    component.message = { ...msg };
    component.ngOnInit();
    expect(component.message.text).toContain('\n');
    expect(component.message.text).not.toContain('<br');
  });

  it('ngOnInit should tolerate missing message', () => {
    component.message = undefined as any;
    expect(() => component.ngOnInit()).not.toThrow();
  });
});
