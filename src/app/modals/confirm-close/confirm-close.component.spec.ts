import { A11yModule } from '@angular/cdk/a11y';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';

import { ConfirmCloseComponent } from './confirm-close.component';

describe('ConfirmCloseComponent', () => {
  let component: ConfirmCloseComponent;
  let fixture: ComponentFixture<ConfirmCloseComponent>;

  beforeEach(waitForAsync(() => {
    const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
    LoggerInstance.setInstance(new CustomLogger(ngxlogger));
    TestBed.configureTestingModule({
      imports: [A11yModule],
      declarations: [ ConfirmCloseComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmCloseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
