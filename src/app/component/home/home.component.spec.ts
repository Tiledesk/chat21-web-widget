import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { NGXLogger } from 'ngx-logger';
import { ConversationModel } from 'src/chat21-core/models/conversation';
import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { TiledeskAuthService } from 'src/chat21-core/providers/tiledesk/tiledesk-auth.service';
import { HEADER_MENU_OPTION } from '../../utils/constants';
import { Globals } from '../../utils/globals';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let globals: Globals;
  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);

  const tiledeskAuthStub = {
    getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
      uid: 'u-1',
      firstname: 'Ada',
      lastname: 'Lovelace',
      email: 'ada@example.com',
    }),
  };

  const translateStub = {
    translateLanguage: jasmine.createSpy('translateLanguage').and.callFake((keys: string[]) => {
      const m = new Map<string, string>();
      keys.forEach((k) => m.set(k, `T:${k}`));
      return m;
    }),
  };

  beforeEach(waitForAsync(() => {
    LoggerInstance.setInstance(new CustomLogger(ngxlogger));
    TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [
        Globals,
        { provide: NGXLogger, useValue: ngxlogger },
        { provide: TiledeskAuthService, useValue: tiledeskAuthStub },
        { provide: CustomTranslateService, useValue: translateStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    globals = TestBed.inject(Globals);
    globals.initDefafultParameters();
    globals.welcomeTitle = 'Benvenuto';
    globals.welcomeMsg = 'Intro';
    globals.themeForegroundColor = '#fff';
    globals.colorGradient = 'linear-gradient(red,blue)';
    globals.project = { logoChat: 'nologo' } as any;
    globals.poweredBy = '<a href="https://brand.example"><span id="pb-inner">Logo</span></a>';
    globals.whatsappNumber = '1234567890';
    globals.telegramUsername = '';
    globals.messangerPageTitle = '';

    component.listConversations = [];
    component.archivedConversations = [];
    component.hideSettings = true;
    component.hideNewConversationButton = false;
    component.stylesMap = new Map([
      ['themeColor', '#111'],
      ['foregroundColor', '#fff'],
    ]);
    component.size = 'min';
    component.fullscreenMode = false;
    component.hideHeaderConversationOptionsMenu = false;
    component.isButtonsDisabled = false;
    component.translationMap = new Map([
      ['MAXIMIZE', 'Massimizza'],
      ['MINIMIZE', 'Riduci'],
      ['CENTER', 'Centra'],
    ]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('translations and DOM shell', () => {
    it('initiTranslations should fill header/footer maps via CustomTranslateService', () => {
      component.initiTranslations();
      expect(component.translationMapHeader?.get('BUTTON_CLOSE_TO_ICON')).toBe('T:BUTTON_CLOSE_TO_ICON');
      expect(component.translationMapFooter?.get('SWITCH_TO')).toBe('T:SWITCH_TO');
    });

    it('should render region root, welcome title and close control', () => {
      const region = fixture.debugElement.query(By.css('#chat21-home-component'));
      expect(region).toBeTruthy();
      const h1 = fixture.nativeElement.querySelector('.c21-text-welcome') as HTMLElement;
      expect(h1.textContent).toContain('Benvenuto');
      const closeBtn = fixture.debugElement.query(By.css('.c21-close-button-body'));
      expect(closeBtn).toBeTruthy();
    });

    it('should set region aria-label from welcomeTitle (accessibility / MCP home shell)', () => {
      globals.welcomeTitle = 'Ciao, benvenuto su BrandExample';
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('#chat21-home-component') as HTMLElement;
      expect(host.getAttribute('aria-label')).toBe('Ciao, benvenuto su BrandExample');
    });

    it('should render welcome intro paragraph when welcomeMsg is set', () => {
      globals.welcomeMsg = 'Come possiamo aiutarti?';
      fixture.detectChanges();
      const intro = fixture.nativeElement.querySelector('.c21-text-intro') as HTMLElement;
      expect(intro.textContent).toContain('Come possiamo aiutarti?');
    });
  });

  describe('outputs and actions', () => {
    it('f21_close should emit onCloseWidget and add start-animation class', () => {
      spyOn(component.onCloseWidget, 'emit');
      component.f21_close();
      expect(component.onCloseWidget.emit).toHaveBeenCalled();
      const root = fixture.debugElement.query(By.css('#chat21-home-component')).nativeElement as HTMLElement;
      expect(root.classList.contains('start-animation')).toBe(true);
    });

    it('onChangeSize should emit correct HEADER_MENU_OPTION', () => {
      spyOn(component.onMenuOptionClick, 'emit');
      component.onChangeSize('min');
      component.onChangeSize('max');
      component.onChangeSize('top');
      expect(component.onMenuOptionClick.emit).toHaveBeenCalledWith(HEADER_MENU_OPTION.MINIMIZE);
      expect(component.onMenuOptionClick.emit).toHaveBeenCalledWith(HEADER_MENU_OPTION.MAXIMIZE);
      expect(component.onMenuOptionClick.emit).toHaveBeenCalledWith(HEADER_MENU_OPTION.TOP);
    });

    it('onNewConversationFN should emit onNewConversation and strip animation', () => {
      spyOn(component.onNewConversation, 'emit');
      const root = fixture.debugElement.query(By.css('#chat21-home-component')).nativeElement as HTMLElement;
      root.classList.add('start-animation');
      component.onNewConversationFN();
      expect(component.onNewConversation.emit).toHaveBeenCalled();
      expect(root.classList.contains('start-animation')).toBe(false);
    });

    it('onConversationSelectedFN should emit conversation', () => {
      spyOn(component.onConversationSelected, 'emit');
      const conv = { uid: 'c1' } as ConversationModel;
      component.onConversationSelectedFN(conv);
      expect(component.onConversationSelected.emit).toHaveBeenCalledWith(conv);
    });

    it('onConversationSelectedFN should ignore null', () => {
      spyOn(component.onConversationSelected, 'emit');
      component.onConversationSelectedFN(null as any);
      expect(component.onConversationSelected.emit).not.toHaveBeenCalled();
    });

    it('onOpenAllConversation should emit onOpenAllConvesations', () => {
      spyOn(component.onOpenAllConvesations, 'emit');
      component.onOpenAllConversation();
      expect(component.onOpenAllConvesations.emit).toHaveBeenCalled();
    });

    it('onSignOutFN should emit onSignOut', () => {
      spyOn(component.onSignOut, 'emit');
      component.onSignOutFN();
      expect(component.onSignOut.emit).toHaveBeenCalled();
    });

    it('onImageLoadedFN / onConversationLoadedFN should forward emits', () => {
      spyOn(component.onImageLoaded, 'emit');
      spyOn(component.onConversationLoaded, 'emit');
      const c = { uid: 'x' } as ConversationModel;
      component.onImageLoadedFN(c);
      component.onConversationLoadedFN(c);
      expect(component.onImageLoaded.emit).toHaveBeenCalledWith(c);
      expect(component.onConversationLoaded.emit).toHaveBeenCalledWith(c);
    });
  });

  describe('hideMenuOptions and openConversationOnPlatform', () => {
    it('hideMenuOptions should set isOpenMenuOptions on Globals', () => {
      spyOn(globals, 'setParameter');
      component.hideMenuOptions();
      expect(globals.setParameter).toHaveBeenCalledWith('isOpenMenuOptions', false, true);
    });

    it('openConversationOnPlatform should open external URLs', () => {
      spyOn(window, 'open');
      globals.telegramUsername = 'mybot';
      globals.whatsappNumber = '39333';
      globals.messangerPageTitle = 'mypage';
      component.openConversationOnPlatform('telegram');
      component.openConversationOnPlatform('whatsapp');
      component.openConversationOnPlatform('messanger');
      expect(window.open).toHaveBeenCalledWith('https://telegram.me/mybot', '_blank');
      expect(window.open).toHaveBeenCalledWith(jasmine.stringMatching(/^https:\/\/wa\.me\/39333/), '_blank');
      expect(window.open).toHaveBeenCalledWith('https://m.me/mypage', '_blank');
    });
  });

  describe('managePoweredBy and analytics', () => {
    it('managePoweredBy should open parent anchor href', () => {
      spyOn(window, 'open');
      const anchor = document.createElement('a');
      anchor.setAttribute('href', 'https://brand.example');
      const inner = document.createElement('span');
      anchor.appendChild(inner);
      const ev = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(ev, 'target', { value: inner, configurable: true });
      component.managePoweredBy(ev);
      expect(window.open).toHaveBeenCalledWith('https://brand.example', '_blank');
    });

    it('segmentLogoClick should invoke analytics when present', () => {
      (window as any).analytics = {
        page: jasmine.createSpy('page'),
        identify: jasmine.createSpy('identify'),
        track: jasmine.createSpy('track'),
      };
      (component as any).segmentLogoClick();
      expect((window as any).analytics.page).toHaveBeenCalled();
      expect((window as any).analytics.identify).toHaveBeenCalled();
      expect((window as any).analytics.track).toHaveBeenCalled();
      delete (window as any).analytics;
    });
  });

  describe('ngAfterViewInit', () => {
    it('should add animation only on first open then clear flag', () => {
      globals.firstOpen = true;
      component.ngAfterViewInit();
      const root = fixture.debugElement.query(By.css('#chat21-home-component')).nativeElement as HTMLElement;
      expect(root.classList.contains('start-animation')).toBe(true);
      expect(globals.firstOpen).toBe(false);
    });

    it('should focus aflistconv after delay when present', fakeAsync(() => {
      const btn = document.createElement('button');
      btn.setAttribute('aflistconv', '');
      spyOn(btn, 'focus');
      (component as any).aflistconv = { nativeElement: btn };
      component.ngAfterViewInit();
      tick(1000);
      expect(btn.focus).toHaveBeenCalled();
    }));
  });
});
