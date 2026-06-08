import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConversationInternalFrameComponent } from './conversation-internal-frame.component';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
describe('ConversationInternalFrameComponent', () => {
  let component: ConversationInternalFrameComponent;
  let fixture: ComponentFixture<ConversationInternalFrameComponent>;
  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
  const customLogger = new CustomLogger(ngxlogger);

  beforeEach(waitForAsync(() => {
    LoggerInstance.setInstance(customLogger);
    TestBed.configureTestingModule({
      declarations: [ConversationInternalFrameComponent],
      imports: [BrowserAnimationsModule],
    })
      .overrideComponent(ConversationInternalFrameComponent, {
        set: {
          template: `
            <iframe #iframe title="inner" src="about:blank"></iframe>
            <button type="button" (click)="returnClose()">close</button>
            <button type="button" (click)="returnOpenExternal()">ext</button>
          `,
        },
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationInternalFrameComponent);
    component = fixture.componentInstance;
    component.button = { link: 'https://example.com/path', value: 'Test' };
    component.translationMap = new Map();
    component.stylesMap = new Map();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should trust resource URL from button.link', () => {
      expect(component.url).toBeDefined();
    });

    it('should leave url unset when button has no link', () => {
      const f = TestBed.createComponent(ConversationInternalFrameComponent);
      const c = f.componentInstance;
      c.button = { value: 'x' };
      c.ngOnInit();
      expect(c.url).toBeUndefined();
      f.destroy();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should run without throwing when iframe is present', () => {
      expect(() => component.ngAfterViewInit()).not.toThrow();
    });
  });

  describe('events', () => {
    it('returnClose should emit onClose and set closed state', () => {
      spyOn(component.onClose, 'emit');
      component.returnClose();
      expect(component.isOpen).toBe('closed');
      expect(component.onClose.emit).toHaveBeenCalled();
    });

    it('returnOpenExternal should emit button payload', () => {
      spyOn(component.onOpenExternal, 'emit');
      component.returnOpenExternal();
      expect(component.onOpenExternal.emit).toHaveBeenCalledWith(component.button);
    });

    it('onIframeLoaded should hide spinner', () => {
      component.hideSpinner = false;
      component.onIframeLoaded({});
      expect(component.hideSpinner).toBe(true);
    });

    it('onError should log', () => {
      spyOn((component as any).logger, 'error');
      component.onError({ message: 'x' });
      expect((component as any).logger.error).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should reset url and spinner', () => {
      component.url = {} as any;
      component.hideSpinner = true;
      component.ngOnDestroy();
      expect(component.url).toBeNull();
      expect(component.hideSpinner).toBe(false);
    });
  });
});
