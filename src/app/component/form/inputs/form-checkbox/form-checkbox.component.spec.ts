import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { FormArray } from 'src/chat21-core/models/formArray';
import { FormCheckboxComponent } from './form-checkbox.component';

@Component({
  template: `
    <form [formGroup]="form">
      <chat-form-checkbox
        [element]="element"
        controlName="acceptTerms"
        [translationErrorLabelMap]="translationErrorLabelMap"
        [stylesMap]="stylesMap"
        [hasSubmitted]="hasSubmitted"
      ></chat-form-checkbox>
    </form>`,
})
class FormCheckboxHostComponent {
  form = new FormBuilder().group({
    acceptTerms: [false, [Validators.requiredTrue]],
  });
  element = {
    name: 'acceptTerms',
    type: 'checkbox',
    text: 'I accept the terms',
    mandatory: true,
    tabIndex: 1500,
  } as FormArray;
  stylesMap = new Map<string, string>([
    ['themeColor', '#2a6ac1'],
    ['foregroundColor', '#ffffff'],
  ]);
  translationErrorLabelMap = new Map<string, string>([
    ['LABEL_ERROR_FIELD_REQUIRED', 'You must accept'],
  ]);
  hasSubmitted = false;
}

describe('FormCheckboxComponent', () => {
  let fixture: ComponentFixture<FormCheckboxHostComponent>;
  let host: FormCheckboxHostComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FormCheckboxHostComponent, FormCheckboxComponent],
      imports: [ReactiveFormsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormCheckboxHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with checkbox wired to label for=id', () => {
    const box = fixture.nativeElement.querySelector(
      'input#c21-prechat-acceptTerms',
    ) as HTMLInputElement;
    expect(box.type).toBe('checkbox');
    const label = fixture.nativeElement.querySelector(
      'label[for="c21-prechat-acceptTerms"]',
    ) as HTMLLabelElement;
    expect(label.textContent?.trim()).toBe('I accept the terms');
  });

  it('should expose aria-invalid after submit when still unchecked', () => {
    host.hasSubmitted = true;
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector(
      'input#c21-prechat-acceptTerms',
    ) as HTMLInputElement;
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(box.getAttribute('aria-describedby')).toBe('c21-prechat-acceptTerms-errors');
    const alert = fixture.nativeElement.querySelector(
      '#c21-prechat-acceptTerms-errors',
    ) as HTMLElement;
    expect(alert.textContent).toContain('You must accept');
  });

  it('onEnterPressed should bubble intent to parent form-builder via output', () => {
    const inner = fixture.debugElement.query(By.directive(FormCheckboxComponent))
      .componentInstance as FormCheckboxComponent;
    spyOn(inner.onKeyEnterPressed, 'emit');
    inner.onEnterPressed(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(inner.onKeyEnterPressed.emit).toHaveBeenCalled();
  });

  it('ariaInvalid should be false before first submit', () => {
    const inner = fixture.debugElement.query(By.directive(FormCheckboxComponent))
      .componentInstance as FormCheckboxComponent;
    expect(inner.ariaInvalid).toBe('false');
  });

  it('fieldBaseId should sanitize special characters in name', () => {
    const inner = fixture.debugElement.query(By.directive(FormCheckboxComponent))
      .componentInstance as FormCheckboxComponent;
    inner.element = { name: 'a/b', text: 'x' } as FormArray;
    expect(inner.fieldBaseId).toBe('c21-prechat-a_b');
  });
});
