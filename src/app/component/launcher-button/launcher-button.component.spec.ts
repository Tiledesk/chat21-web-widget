import { Injectable, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppStorageService } from '../../../chat21-core/providers/abstract/app-storage.service';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';
import { Globals } from '../../utils/globals';
import { LauncherButtonComponent } from './launcher-button.component';

@Injectable()
class AppStorageStub extends AppStorageService {
  initialize(): void {}
  getItem(): any {
    return null;
  }
  setItem(): void {}
  getItemWithoutProjectID(): any {
    return null;
  }
  setItemWithoutProjectID(): void {}
  removeItem(): void {}
  clear(): void {}
}

describe('LauncherButtonComponent', () => {
  let fixture: ComponentFixture<LauncherButtonComponent>;
  let component: LauncherButtonComponent;
  let globals: Globals;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LauncherButtonComponent],
      imports: [NoopAnimationsModule],
      providers: [Globals, { provide: AppStorageService, useClass: AppStorageStub }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LauncherButtonComponent);
    component = fixture.componentInstance;
    globals = TestBed.inject(Globals);
    globals.initDefafultParameters();
    globals.isOpen = false;
    globals.align = 'right';
    globals.marginX = '20px';
    globals.marginY = '24px';
    globals.themeColor = '#2a6ac1';
    globals.themeForegroundColor = '#ffffff';
    globals.launcherWidth = '60px';
    globals.launcherHeight = '60px';
    globals.baloonShape = '50%';
    globals.baloonImage = '';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mostra il pulsante quando il widget è chiuso (isOpen=false)', () => {
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('#c21-launcher-button'));
    expect(btn).toBeTruthy();
  });

  it('non mostra il launcher quando il widget è aperto', () => {
    globals.isOpen = true;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('#c21-launcher-button'))).toBeNull();
  });

  it('applica border-radius da baloonShape e dimensioni da launcherWidth/Height', () => {
    globals.baloonShape = '12px 4px 18px 8px';
    globals.launcherWidth = '72px';
    globals.launcherHeight = '80px';
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('#c21-launcher-button')).nativeElement as HTMLElement;
    expect(btn.style.borderRadius).toBe('12px 4px 18px 8px');
    expect(btn.style.width).toBe('72px');
    expect(btn.style.height).toBe('80px');
  });

  it('con baloonImage: sfondo pulsante null e immagine con stesso border-radius', () => {
    globals.baloonImage = 'https://cdn.example/launcher.svg';
    globals.baloonShape = '8px';
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('#c21-launcher-button')).nativeElement as HTMLElement;
    expect(btn.style.backgroundColor === '' || btn.style.backgroundColor === 'rgba(0, 0, 0, 0)').toBe(true);
    const img = fixture.debugElement.query(By.css('img')).nativeElement as HTMLImageElement;
    expect(img.src).toContain('launcher.svg');
    expect(img.style.borderRadius).toBe('8px');
  });

  it('senza baloonImage: usa themeColor come background e classe allineamento sinistro', () => {
    globals.baloonImage = '';
    globals.align = 'left';
    globals.themeColor = '#ff0000';
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('#c21-launcher-button')).nativeElement as HTMLElement;
    expect(btn.style.backgroundColor).not.toBe('');
    expect(btn.classList.contains('c21-align-left')).toBe(true);
  });

  it('ngAfterViewInit imposta box-shadow quando widget chiuso', fakeAsync(() => {
    globals.isOpen = false;
    fixture.detectChanges();
    tick(0);
    const btn = fixture.debugElement.query(By.css('#c21-launcher-button'))?.nativeElement as HTMLElement;
    expect(btn).toBeTruthy();
    const shadow = btn.style.boxShadow.replace(/\s/g, '');
    expect(shadow).toContain('0px4px20px');
    expect(shadow).toContain(convertColorToRGBA(globals.themeColor, 50).replace(/\s/g, ''));
  }));

  it('openCloseWidget emette lo stato corrente di isOpen', () => {
    globals.isOpen = false;
    spyOn(component.onButtonClicked, 'emit');
    component.openCloseWidget();
    expect(component.onButtonClicked.emit).toHaveBeenCalledWith(false);
    globals.isOpen = true;
    component.openCloseWidget();
    expect(component.onButtonClicked.emit).toHaveBeenCalledWith(true);
  });
});
