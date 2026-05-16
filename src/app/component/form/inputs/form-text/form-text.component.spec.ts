import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { FormArray } from 'src/chat21-core/models/formArray';
import { clonePrechatFormJsonMock } from '../../prechat-form-test-mock';
import { FormTextComponent } from './form-text.component';

@Component({
  template: `
    <form [formGroup]="form">
      <chat-form-text
        [element]="element"
        [controlName]="controlName"
        [translationErrorLabelMap]="translationErrorLabelMap"
        [stylesMap]="stylesMap"
        [hasSubmitted]="hasSubmitted"
      ></chat-form-text>
    </form>`,
})
class FormTextHostComponent {
  form = new FormBuilder().group({
    userFullname: ['', Validators.required],
    userEmail: ['', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
  });
  controlName = 'userFullname';
  element = {
    name: 'userFullname',
    type: 'text',
    mandatory: true,
    text: 'User fullname',
    tabIndex: 1411,
  } as FormArray;
  stylesMap = new Map<string, string>([
    ['themeColor', '#2a6ac1'],
    ['foregroundColor', '#ffffff'],
  ]);
  translationErrorLabelMap = new Map<string, string>([
    ['LABEL_ERROR_FIELD_REQUIRED', 'Required field'],
  ]);
  hasSubmitted = false;
}

describe('FormTextComponent', () => {
  let hostFixture: ComponentFixture<FormTextHostComponent>;
  let host: FormTextHostComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FormTextHostComponent, FormTextComponent],
      imports: [ReactiveFormsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    hostFixture = TestBed.createComponent(FormTextHostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should create with label and stable id from mock-like field', () => {
    expect(hostFixture.nativeElement.querySelector('chat-form-text')).toBeTruthy();
    const input = hostFixture.nativeElement.querySelector(
      'input#c21-prechat-userFullname',
    ) as HTMLInputElement;
    expect(input.type).toBe('text');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('should use email input type when control name suggests email', () => {
    host.controlName = 'userEmail';
    host.element = clonePrechatFormJsonMock()[1] as FormArray;
    host.element.text = 'Email';
    hostFixture.detectChanges();
    const input = hostFixture.nativeElement.querySelector(
      'input#c21-prechat-userEmail',
    ) as HTMLInputElement;
    expect(input.type).toBe('email');
  });

  it('should show required error region when submitted and empty', () => {
    host.hasSubmitted = true;
    hostFixture.detectChanges();
    const input = hostFixture.nativeElement.querySelector(
      'input#c21-prechat-userFullname',
    ) as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('c21-prechat-userFullname-errors');
    const alert = hostFixture.nativeElement.querySelector(
      '#c21-prechat-userFullname-errors',
    ) as HTMLElement;
    expect(alert.textContent).toContain('Required field');
  });

  it('onEnterPressed should emit keyboard event', () => {
    const inner = hostFixture.debugElement.query(By.directive(FormTextComponent))
      .componentInstance as FormTextComponent;
    spyOn(inner.onKeyEnterPressed, 'emit');
    const ev = new KeyboardEvent('keydown', { key: 'Enter' });
    inner.onEnterPressed(ev);
    expect(inner.onKeyEnterPressed.emit).toHaveBeenCalledWith(ev);
  });

  it('ariaInvalid should stay false until form is submitted', () => {
    const inner = hostFixture.debugElement.query(By.directive(FormTextComponent))
      .componentInstance as FormTextComponent;
    expect(inner.ariaInvalid).toBe('false');
    host.hasSubmitted = true;
    hostFixture.detectChanges();
    expect(inner.ariaInvalid).toBe('true');
  });

  it('ngOnChanges should map theme CSS variables onto host', () => {
    const innerDe = hostFixture.debugElement.query(By.directive(FormTextComponent));
    const inner = innerDe.componentInstance as FormTextComponent;
    inner.ngOnChanges({
      stylesMap: {
        currentValue: host.stylesMap,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    } as any);
    expect(innerDe.nativeElement.style.getPropertyValue('--themeColor')).toBe('#2a6ac1');
  });
});
