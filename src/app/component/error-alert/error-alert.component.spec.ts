import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';
import { FILE_SIZE_LIMIT } from 'src/app/utils/constants';
import { ErrorAlertComponent } from './error-alert.component';

describe('ErrorAlertComponent', () => {
  let component: ErrorAlertComponent;
  let fixture: ComponentFixture<ErrorAlertComponent>;
  let translateStub: { translateLanguage: jasmine.Spy };

  beforeEach(async () => {
    translateStub = {
      translateLanguage: jasmine.createSpy('translateLanguage').and.callFake((keys: string[]) => {
        const m = new Map<string, string>();
        keys.forEach((k) => m.set(k, `Errore: {{FILE_SIZE_LIMIT}} MB (chiave ${k})`));
        return m;
      }),
    };

    await TestBed.configureTestingModule({
      declarations: [ErrorAlertComponent],
      providers: [{ provide: CustomTranslateService, useValue: translateStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorAlertComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('inputs and translation key path', () => {
    it('should resolve errorKeyMessage via CustomTranslateService and interpolate constants + errorParams', () => {
      component.errorKeyMessage = 'MY_KEY';
      component.errorParams = { FILE_SIZE_LIMIT: 99 };
      component.ngOnInit();
      expect(translateStub.translateLanguage).toHaveBeenCalledWith(['MY_KEY']);
      expect(component.errorMessage).toContain('99');
      expect(component.errorMessage).toContain('(chiave MY_KEY)');
    });

    it('should render translated message in the alert DOM', () => {
      component.errorKeyMessage = 'NET_ERR';
      component.ngOnInit();
      fixture.detectChanges();
      const content = fixture.debugElement.query(By.css('.alert-content')).nativeElement as HTMLElement;
      expect(content.textContent?.trim().length).toBeGreaterThan(0);
      expect(fixture.nativeElement.querySelector('#alert-container')).toBeTruthy();
    });
  });

  describe('plain errorMessage and interpolation', () => {
    it('should use raw errorMessage when errorKeyMessage is empty', () => {
      component.errorKeyMessage = '';
      component.errorMessage = 'Connessione persa';
      component.ngOnInit();
      expect(translateStub.translateLanguage).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe('Connessione persa');
    });

    it('should replace {{placeholders}} from merged CONSTANTS and errorParams', () => {
      component.errorKeyMessage = '';
      component.errorMessage = 'Limite {{FILE_SIZE_LIMIT}} MB, extra {{custom}} e {{missing}}';
      component.errorParams = { custom: 'X' };
      component.ngOnInit();
      expect(component.errorMessage).toContain(String(FILE_SIZE_LIMIT));
      expect(component.errorMessage).toContain('X');
      expect(component.errorMessage).toContain('{{missing}}');
    });

    it('should leave errorMessage empty when neither key nor plain message is set (widget happy path)', () => {
      component.errorKeyMessage = '';
      component.errorMessage = '';
      component.ngOnInit();
      expect(component.errorMessage).toBe('');
      fixture.detectChanges();
      const content = fixture.nativeElement.querySelector('.alert-content') as HTMLElement;
      expect(content.textContent?.trim()).toBe('');
    });
  });
});
