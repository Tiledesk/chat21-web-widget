import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { NGXLogger } from 'ngx-logger';
import { Globals } from '../../utils/globals';

import { EyeeyeCatcherCardComponent } from './eyeeye-catcher-card.component';

describe('EyeeyeCatcherCardComponent', () => {
  let component: EyeeyeCatcherCardComponent;
  let fixture: ComponentFixture<EyeeyeCatcherCardComponent>;
  let globals: Globals;
  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);

  beforeEach(waitForAsync(() => {
    LoggerInstance.setInstance(new CustomLogger(ngxlogger));
    TestBed.configureTestingModule({
      declarations: [EyeeyeCatcherCardComponent],
      imports: [BrowserAnimationsModule],
      providers: [Globals],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EyeeyeCatcherCardComponent);
    component = fixture.componentInstance;
    globals = TestBed.inject(Globals);
    globals.initDefafultParameters();
    globals.CALLOUT_TITLE_PLACEHOLDER = '👋 Ciao utente';
    globals.calloutTitle = '';
    globals.calloutMsg = 'Messaggio callout';
    globals.isOpen = false;
    globals.calloutStaus = true;
    spyOn(globals, 'setParameter').and.callThrough();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit and layout state', () => {
    it('should set initial state and hide callout via Globals', () => {
      expect(component.state).toBe('default');
      expect(globals.setParameter).toHaveBeenCalledWith('displayEyeCatcherCard', 'none');
      expect(component.displayEyeCatcherCardCloseBtnWrapper).toBe('none');
    });

    it('should render callout card container with alignment class from Globals', () => {
      globals.align = 'left';
      fixture.detectChanges();
      const card = fixture.debugElement.query(By.css('.eye-catcher-card'));
      expect(card.nativeElement.classList.contains('c21-align-left')).toBe(true);
    });
  });

  describe('openEyeCatcher and outputs', () => {
    it('when chat closed and callout enabled should show card and emit onCloseEyeCatcherCard(true)', () => {
      globals.isOpen = false;
      globals.calloutStaus = true;
      spyOn(component.onCloseEyeCatcherCard, 'emit');
      component.openEyeCatcher();
      expect(component.onCloseEyeCatcherCard.emit).toHaveBeenCalledWith(true);
      expect(globals.setParameter).toHaveBeenCalledWith('displayEyeCatcherCard', 'block');
      expect(component.displayEyeCatcherCardCloseBtnWrapper).toBe('block');
    });

    it('when chat already open should not emit or display card', () => {
      globals.isOpen = true;
      globals.calloutStaus = true;
      spyOn(component.onCloseEyeCatcherCard, 'emit');
      component.openEyeCatcher();
      expect(component.onCloseEyeCatcherCard.emit).not.toHaveBeenCalled();
    });

    it('when callout is disabled should not show card even if chat is closed', () => {
      globals.isOpen = false;
      globals.calloutStaus = false;
      spyOn(component.onCloseEyeCatcherCard, 'emit');
      component.openEyeCatcher();
      expect(component.onCloseEyeCatcherCard.emit).not.toHaveBeenCalled();
      expect(component.displayEyeCatcherCardCloseBtnWrapper).toBe('none');
    });
  });

  describe('checkIsEmoji, openChatFromEyeCatcherCard, closeEyeCatcherCard', () => {
    it('checkIsEmoji should split leading emoji into emoticon and title', () => {
      globals.calloutTitle = '🚀 Supporto';
      component.checkIsEmoji();
      expect(component.emoticon).toBe('🚀');
      expect(component.title).toContain('Supporto');
    });

    it('openChatFromEyeCatcherCard should hide card and emit onOpenChat', () => {
      spyOn(component.onOpenChat, 'emit');
      component.openChatFromEyeCatcherCard();
      expect(globals.setParameter).toHaveBeenCalledWith('displayEyeCatcherCard', 'none');
      expect(component.onOpenChat.emit).toHaveBeenCalled();
    });

    it('closeEyeCatcherCard should emit false, hide card and disable callout', () => {
      spyOn(component.onCloseEyeCatcherCard, 'emit');
      component.closeEyeCatcherCard();
      expect(component.onCloseEyeCatcherCard.emit).toHaveBeenCalledWith(false);
      expect(globals.setParameter).toHaveBeenCalledWith('displayEyeCatcherCard', 'none');
      expect(globals.setParameter).toHaveBeenCalledWith('calloutStaus', false, true);
      expect(component.displayEyeCatcherCardCloseBtnWrapper).toBe('none');
    });
  });
});
