import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';

import { AppConfigService } from '../../../providers/app-config.service';
import { HEADER_MENU_OPTION } from '../../../utils/constants';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { NGXLogger } from 'ngx-logger';
import { ConversationHeaderComponent } from './conversation-header.component';

describe('ConversationHeaderComponent', () => {
  let component: ConversationHeaderComponent;
  let fixture: ComponentFixture<ConversationHeaderComponent>;
  let httpMock: HttpTestingController;

  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
  const customLogger = new CustomLogger(ngxlogger);

  const apiUrl = 'https://api.example.com/';
  const appConfigStub = {
    getConfig: jasmine.createSpy('getConfig').and.returnValue({ apiUrl }),
  };

  beforeEach(async () => {
    LoggerInstance.setInstance(customLogger);

    await TestBed.configureTestingModule({
      declarations: [ConversationHeaderComponent],
      providers: [
        { provide: AppConfigService, useValue: appConfigStub },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(ConversationHeaderComponent, {
        set: {
          template: `
            <button class="back" (click)="returnHome()">back</button>
            <button class="close-widget" (click)="closeWidget()">closeW</button>
            <button class="toggle-menu" (click)="toggleMenu()">menu</button>
            <button class="close-chat" (click)="closeChat()">closeChat</button>
            <button class="restart" (click)="restartChat()">restart</button>
            <button class="detail" (click)="openDetail()">detail</button>
            <button class="signout" (click)="signOut()">signout</button>
            <button class="sound" (click)="toggleSound()">sound</button>
            <button class="max" (click)="onChangeSize('max')">max</button>
            <button class="min" (click)="onChangeSize('min')">min</button>
            <button class="top" (click)="onChangeSize('top')">top</button>
            <button class="transcript" (click)="dowloadTranscript()">transcript</button>
          `,
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConversationHeaderComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    component.translationMap = new Map([['OPTIONS', 'Opt']]);
    component.senderId = 'sender-1';
    component.idConversation = 'conv-1';
    component.windowContext = window;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor / ngOnInit', () => {
    it('should read apiUrl from AppConfigService', () => {
      expect((component as any).API_URL).toBe(apiUrl);
    });

    it('ngOnInit should add senderId to membersConversation', () => {
      const m = new ConversationHeaderComponent(appConfigStub as unknown as AppConfigService);
      m.senderId = 'u1';
      m.translationMap = new Map();
      m.ngOnInit();
      expect(m.membersConversation).toContain('u1');
    });
  });

  describe('ngOnChanges', () => {
    it('should run when idConversation is set', () => {
      component.idConversation = 'new-id';
      component.ngOnChanges({
        idConversation: {
          previousValue: undefined,
          currentValue: 'new-id',
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      expect(component).toBeTruthy();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should enable header buttons', () => {
      component.isButtonsDisabled = true;
      component.ngAfterViewInit();
      expect(component.isButtonsDisabled).toBe(false);
    });
  });

  describe('click handlers / outputs', () => {
    it('returnHome should emit onBack', () => {
      spyOn(component.onBack, 'emit');
      component.returnHome();
      expect(component.onBack.emit).toHaveBeenCalled();
    });

    it('closeWidget should emit onCloseWidget', () => {
      spyOn(component.onCloseWidget, 'emit');
      component.closeWidget();
      expect(component.onCloseWidget.emit).toHaveBeenCalled();
    });

    it('toggleMenu should flip menu visibility', () => {
      spyOn(component.onMenuOptionShow, 'emit');
      component.isMenuShow = false;
      component.toggleMenu();
      expect(component.onMenuOptionShow.emit).toHaveBeenCalledWith(true);
    });

    it('closeChat should emit CLOSE option', () => {
      spyOn(component.onMenuOptionClick, 'emit');
      component.closeChat();
      expect(component.onMenuOptionClick.emit).toHaveBeenCalledWith(HEADER_MENU_OPTION.CLOSE);
    });

    it('restartChat should emit RESTART and close menu', () => {
      spyOn(component.onMenuOptionClick, 'emit');
      spyOn(component.onMenuOptionShow, 'emit');
      component.restartChat();
      expect(component.onMenuOptionClick.emit).toHaveBeenCalledWith(HEADER_MENU_OPTION.RESTART);
      expect(component.onMenuOptionShow.emit).toHaveBeenCalledWith(false);
    });

    it('openDetail should emit DETAIL', () => {
      spyOn(component.onMenuOptionClick, 'emit');
      component.openDetail();
      expect(component.onMenuOptionClick.emit).toHaveBeenCalledWith(HEADER_MENU_OPTION.DETAIL);
    });

    it('signOut should emit LOGOUT', () => {
      spyOn(component.onMenuOptionClick, 'emit');
      component.signOut();
      expect(component.onMenuOptionClick.emit).toHaveBeenCalledWith(HEADER_MENU_OPTION.LOGOUT);
    });

    it('onChangeSize max should emit MAXIMIZE and close menu', () => {
      spyOn(component.onMenuOptionClick, 'emit');
      spyOn(component.onMenuOptionShow, 'emit');
      component.onChangeSize('max');
      expect(component.onMenuOptionClick.emit).toHaveBeenCalledWith(HEADER_MENU_OPTION.MAXIMIZE);
      expect(component.onMenuOptionShow.emit).toHaveBeenCalledWith(false);
    });

    it('toggleSound should emit volume option and flip soundEnabled', () => {
      spyOn(component.onMenuOptionClick, 'emit');
      spyOn(component.onMenuOptionShow, 'emit');
      component.soundEnabled = false;
      component.toggleSound();
      expect(component.soundEnabled).toBe(true);
      expect(component.onMenuOptionClick.emit).toHaveBeenCalledWith(HEADER_MENU_OPTION.VOLUME_ON);
      component.toggleSound();
      expect(component.onMenuOptionClick.emit).toHaveBeenCalledWith(HEADER_MENU_OPTION.VOLUME_OFF);
    });
  });

  describe('dowloadTranscript', () => {
    it('should open transcript URL in windowContext', () => {
      const openSpy = jasmine.createSpy('open');
      component.windowContext = { open: openSpy };
      component.idConversation = 'req-99';
      component.dowloadTranscript();
      expect(openSpy).toHaveBeenCalledWith(apiUrl + 'public/requests/req-99/messages-user.html', '_blank');
    });
  });

  describe('DOM integration', () => {
    it('should wire back button', () => {
      spyOn(component, 'returnHome');
      const btn = fixture.nativeElement.querySelector('.back');
      btn.click();
      expect(component.returnHome).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clear subscription entries when subscriptions use value.unsubscribe', () => {
      const unsub = jasmine.createSpy('unsubscribe');
      (component as any).subscriptions = [{ value: { unsubscribe: unsub } }];
      component.ngOnDestroy();
      expect(unsub).toHaveBeenCalled();
      expect((component as any).subscriptions.length).toBe(0);
    });

    it('should not throw when subscriptions is empty', () => {
      (component as any).subscriptions = [];
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('onChangeSize edge cases', () => {
    beforeEach(() => {
      spyOn(component.onMenuOptionClick, 'emit');
      spyOn(component.onMenuOptionShow, 'emit');
    });

    it('should emit MINIMIZE for min', () => {
      component.onChangeSize('min');
      expect(component.onMenuOptionClick.emit).toHaveBeenCalledWith(HEADER_MENU_OPTION.MINIMIZE);
    });

    it('should emit TOP for top', () => {
      component.onChangeSize('top');
      expect(component.onMenuOptionClick.emit).toHaveBeenCalledWith(HEADER_MENU_OPTION.TOP);
    });

    it('should emit nothing for unknown status (only menu close)', () => {
      (component.onMenuOptionClick.emit as jasmine.Spy).calls.reset();
      component.onChangeSize('unknown' as any);
      expect(component.onMenuOptionClick.emit).not.toHaveBeenCalled();
      expect(component.onMenuOptionShow.emit).toHaveBeenCalledWith(false);
    });
  });

  describe('toggleMenu observable-style flips', () => {
    it('should emit negation when menu already open', () => {
      spyOn(component.onMenuOptionShow, 'emit');
      component.isMenuShow = true;
      component.toggleMenu();
      expect(component.onMenuOptionShow.emit).toHaveBeenCalledWith(false);
    });
  });

  describe('dowloadTranscript error handling', () => {
    it('should propagate open failure and not emit menu close after throw', () => {
      spyOn(component.onMenuOptionShow, 'emit');
      component.windowContext = {
        open: jasmine.createSpy('open').and.throwError('blocked'),
      };
      expect(() => component.dowloadTranscript()).toThrow();
      expect(component.onMenuOptionShow.emit).not.toHaveBeenCalled();
    });
  });

  describe('DOM click integration (handlers)', () => {
    const clickClass = (cls: string) => (fixture.nativeElement as HTMLElement).querySelector(cls)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    it('wires close-widget, toggle-menu, transcript', () => {
      spyOn(component, 'closeWidget');
      spyOn(component, 'toggleMenu');
      spyOn(component, 'dowloadTranscript');
      clickClass('.close-widget');
      clickClass('.toggle-menu');
      clickClass('.transcript');
      expect(component.closeWidget).toHaveBeenCalled();
      expect(component.toggleMenu).toHaveBeenCalled();
      expect(component.dowloadTranscript).toHaveBeenCalled();
    });

    it('wires sound and resize buttons', () => {
      spyOn(component, 'toggleSound');
      spyOn(component, 'onChangeSize');
      clickClass('.sound');
      clickClass('.max');
      expect(component.toggleSound).toHaveBeenCalled();
      expect(component.onChangeSize).toHaveBeenCalledWith('max');
    });
  });

  describe('ngOnInit edge', () => {
    it('should push undefined senderId when missing', () => {
      const h = new ConversationHeaderComponent(appConfigStub as unknown as AppConfigService);
      h.senderId = undefined as any;
      h.translationMap = new Map();
      h.ngOnInit();
      expect(h.membersConversation.length).toBeGreaterThan(1);
    });
  });
});
