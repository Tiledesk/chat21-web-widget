import { CommonModule } from '@angular/common';
import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { FormCheckboxComponent } from '../inputs/form-checkbox/form-checkbox.component';
import { FormLabelComponent } from '../inputs/form-label/form-label.component';
import { FormTextComponent } from '../inputs/form-text/form-text.component';
import { FormTextareaComponent } from '../inputs/form-textarea/form-textarea.component';
import { clonePrechatFormJsonMock } from '../prechat-form-test-mock';
import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';

import { FormBuilderComponent } from './form-builder.component';

describe('FormBuilderComponent', () => {
  let component: FormBuilderComponent;
  let fixture: ComponentFixture<FormBuilderComponent>;
  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error']);
  const customLogger = new CustomLogger(ngxlogger);
  let origLanguages: PropertyDescriptor | undefined;

  beforeEach(() => {
    origLanguages = Object.getOwnPropertyDescriptor(navigator, 'languages');
    Object.defineProperty(navigator, 'languages', {
      configurable: true,
      get: () => ['en-US', 'en'],
    });
  });

  afterEach(() => {
    if (origLanguages) {
      Object.defineProperty(navigator, 'languages', origLanguages);
    } else {
      delete (navigator as any).languages;
    }
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        FormBuilderComponent,
        FormTextComponent,
        FormTextareaComponent,
        FormCheckboxComponent,
        FormLabelComponent,
      ],
      imports: [CommonModule, ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        {
          provide: CustomTranslateService,
          useValue: {
            translateLanguage: (keys: string[]) => {
              const m = new Map<string, string>();
              keys.forEach((k: string) => m.set(k, k));
              return m;
            },
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormBuilderComponent);
    component = fixture.componentInstance;
    LoggerInstance.setInstance(customLogger);
    component['logger'] = LoggerInstance.getInstance();
    component.stylesMap = new Map([
      ['themeColor', '#2a6ac1'],
      ['foregroundColor', '#ffffff'],
    ]);
    component.isOpenPrechatForm = true;
  });

  function applyFormArray(arr: any[]) {
    component.formArray = arr;
    component.ngOnChanges({ formArray: new SimpleChange(null, arr, true) } as any);
    fixture.detectChanges();
  }

  it('should create', () => {
    applyFormArray([]);
    expect(component).toBeTruthy();
  });

  it('with pre-chat mock should translate labels to English and build validators', () => {
    const mock = clonePrechatFormJsonMock();
    applyFormArray(mock);
    expect(mock[0].text).toBe('User fullname');
    expect(mock[1].text).toBe('Email');
    expect(mock[1].errorLabel).toBe('Invalid email address');
    expect(component.preChatFormGroupCustom.get('userFullname')?.hasError('required')).toBe(true);
    expect(component.preChatFormGroupCustom.valid).toBe(false);
    component.preChatFormGroupCustom.patchValue({
      userFullname: 'John',
      userEmail: 'john@example.com',
    });
    expect(component.preChatFormGroupCustom.valid).toBe(true);
  });

  it('onSubmitPreChatForm should emit value when form is valid', () => {
    spyOn(component.onSubmitForm, 'emit');
    applyFormArray(clonePrechatFormJsonMock());
    component.preChatFormGroupCustom.patchValue({
      userFullname: 'John',
      userEmail: 'john@example.com',
    });
    component.onSubmitPreChatForm();
    expect(component.onSubmitForm.emit).toHaveBeenCalledWith({
      userFullname: 'John',
      userEmail: 'john@example.com',
    });
  });

  it('onSubmitPreChatForm should not emit when invalid but set submitted', () => {
    spyOn(component.onSubmitForm, 'emit');
    applyFormArray(clonePrechatFormJsonMock());
    component.onSubmitPreChatForm();
    expect(component.onSubmitForm.emit).not.toHaveBeenCalled();
    expect(component.submitted).toBe(true);
  });

  it('onEnterButtonPressed should delegate to submit', () => {
    spyOn(component, 'onSubmitPreChatForm');
    component.onEnterButtonPressed({});
    expect(component.onSubmitPreChatForm).toHaveBeenCalled();
  });

  it('unsupported field type should emit onErrorRenderForm and yield empty group', () => {
    spyOn(component.onErrorRenderForm, 'emit');
    applyFormArray([{ name: 'x', type: 'select', label: { en: 'X' } }]);
    expect(component.onErrorRenderForm.emit).toHaveBeenCalled();
    expect(Object.keys(component.preChatFormGroupCustom.controls)).toEqual([]);
  });

  it('getAcceptLanguage should pick browser language when keys match navigator.languages', () => {
    const lang = component.getAcceptLanguage({ default: 'fallback', en: 'English', it: 'Italian' } as any);
    expect(lang).toBe('en');
  });

  describe('getAcceptLanguage with non-matching browser languages', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'languages', {
        configurable: true,
        get: () => ['xx-XX'],
      });
    });
    afterEach(() => {
      Object.defineProperty(navigator, 'languages', {
        configurable: true,
        get: () => ['en-US', 'en'],
      });
    });

    it('should return default when present and no other key matches', () => {
      const lang = component.getAcceptLanguage({ default: 'fallback', fr: 'Français' } as any);
      expect(lang).toBe('default');
    });
  });

  it('onResetForm should clear submitted flag and reset controls', () => {
    applyFormArray(clonePrechatFormJsonMock());
    component.preChatFormGroupCustom.patchValue({
      userFullname: 'John',
      userEmail: 'john@example.com',
    });
    component.onSubmitPreChatForm();
    expect(component.submitted).toBe(true);
    component.onResetForm();
    expect(component.submitted).toBe(false);
    expect(component.preChatFormGroupCustom.value).toEqual({
      userFullname: null,
      userEmail: null,
    });
  });

  it('should render text inputs from mock in the template', () => {
    applyFormArray(clonePrechatFormJsonMock());
    const inputs = fixture.nativeElement.querySelectorAll('input[type="text"], input[type="email"]');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });
});
