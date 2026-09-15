import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';
import { Globals } from '../../utils/globals';
import { MenuOptionsComponent } from './menu-options.component';

describe('MenuOptionsComponent', () => {
  let fixture: ComponentFixture<MenuOptionsComponent>;
  let component: MenuOptionsComponent;
  let globals: Globals;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MenuOptionsComponent],
      providers: [Globals],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuOptionsComponent);
    component = fixture.componentInstance;
    globals = TestBed.inject(Globals);
    globals.initDefafultParameters();
    globals.OPTIONS = 'Opzioni';
    globals.SOUND_ON = 'Suono on';
    globals.SOUND_OFF = 'Suono off';
    globals.LOGOUT = 'Esci';
    globals.BUILD_VERSION = 'v9.9.9-test';
    globals.themeColor = '#2a6ac1';
    globals.soundEnabled = true;
    globals.isOpenMenuOptions = false;
    globals.isLogged = false;
    globals.showLogoutOption = true;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit calcola themeColor50 da themeColor', () => {
    fixture.detectChanges();
    expect(component.themeColor50).toBe(convertColorToRGBA(globals.themeColor, 50));
  });

  it('f21_toggle_options apre e chiude il menu', () => {
    fixture.detectChanges();
    const toggle = fixture.debugElement.query(By.css('.button-menu-options'));
    toggle.triggerEventHandler('click', null);
    expect(globals.isOpenMenuOptions).toBe(true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.modal-menu-options'))).toBeTruthy();
    component.f21_toggle_options();
    expect(globals.isOpenMenuOptions).toBe(false);
  });

  it('toggleSound inverte soundEnabled e chiude il menu', () => {
    globals.soundEnabled = false;
    globals.isOpenMenuOptions = true;
    fixture.detectChanges();
    component.toggleSound();
    expect(globals.soundEnabled).toBe(true);
    expect(globals.isOpenMenuOptions).toBe(false);
  });

  it('signOut emette onSignOut e chiude il menu', () => {
    spyOn(component.onSignOut, 'emit');
    globals.isOpenMenuOptions = true;
    component.signOut();
    expect(globals.isOpenMenuOptions).toBe(false);
    expect(component.onSignOut.emit).toHaveBeenCalled();
  });

  it('menu aperto: etichette suono e versione visibili', () => {
    globals.isOpenMenuOptions = true;
    globals.soundEnabled = true;
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Suono on');
    expect(root.textContent).toContain('v9.9.9-test');
  });

  it('logout visibile solo con isLogged e showLogoutOption', () => {
    globals.isOpenMenuOptions = true;
    globals.isLogged = false;
    globals.showLogoutOption = true;
    fixture.detectChanges();
    let logoutBtn = fixture.debugElement.queryAll(By.css('.modal-menu-options button')).find((d) =>
      (d.nativeElement as HTMLElement).getAttribute('aria-label')?.includes('Esci'),
    );
    expect(logoutBtn).toBeFalsy();

    globals.isLogged = true;
    fixture.detectChanges();
    logoutBtn = fixture.debugElement.queryAll(By.css('.modal-menu-options button')).find((d) =>
      (d.nativeElement as HTMLElement).getAttribute('aria-label') === 'Esci',
    );
    expect(logoutBtn).toBeTruthy();
  });

  it('isHover espone l’icona ingranaggio (mouseover / mouseleave)', () => {
    fixture.detectChanges();
    const toggle = fixture.debugElement.query(By.css('.button-menu-options'));
    expect(component.isHover).toBe(false);
    toggle.triggerEventHandler('mouseover', null);
    expect(component.isHover).toBe(true);
    toggle.triggerEventHandler('mouseleave', null);
    expect(component.isHover).toBe(false);
  });

  it('aria-expanded del toggle riflette isOpenMenuOptions', () => {
    globals.isOpenMenuOptions = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('.button-menu-options')).nativeElement as HTMLButtonElement;
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('keydown escape sul pannello opzioni chiude il menu', () => {
    globals.isOpenMenuOptions = true;
    fixture.detectChanges();
    const modal = fixture.debugElement.query(By.css('.modal-menu-options'));
    const ev = new KeyboardEvent('keydown', { key: 'Escape' });
    spyOn(ev, 'preventDefault');
    spyOn(ev, 'stopPropagation');
    modal.triggerEventHandler('keydown.escape', ev);
    expect(globals.isOpenMenuOptions).toBe(false);
  });

  it('pulsante suono espone aria-pressed e aria-label in base a soundEnabled', () => {
    globals.isOpenMenuOptions = true;
    globals.soundEnabled = false;
    fixture.detectChanges();
    const soundBtn = fixture.debugElement.query(By.css('button[aria-label="Suono off"]'))
      .nativeElement as HTMLButtonElement;
    expect(soundBtn.getAttribute('aria-pressed')).toBe('false');
    globals.soundEnabled = true;
    fixture.detectChanges();
    const soundOn = fixture.debugElement.query(By.css('button[aria-label="Suono on"]'))
      .nativeElement as HTMLButtonElement;
    expect(soundOn.getAttribute('aria-pressed')).toBe('true');
  });
});
