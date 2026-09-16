import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { FormArray } from 'src/chat21-core/models/formArray';
import { clonePrechatFormJsonMock } from '../../prechat-form-test-mock';
import { FormTextareaComponent } from './form-textarea.component';

@Component({
  template: `
    <form [formGroup]="form">
      <chat-form-textarea
        [element]="element"
        [controlName]="controlName"
        [rows]="rows"
        [translationErrorLabelMap]="translationErrorLabelMap"
        [stylesMap]="stylesMap"
        [hasSubmitted]="hasSubmitted">
      </chat-form-textarea>
    </form>`,
})
class FormTextareaHostComponent {
  form = new FormBuilder().group({
    notes: ['', [Validators.required, Validators.pattern(/^[A-Z]+$/)]],
  });
  controlName = 'notes';
  rows = 5;
  element = {
    name: 'notes',
    type: 'textarea',
    text: 'Note libere',
    mandatory: true,
    tabIndex: 2,
    errorLabel: 'Solo maiuscole',
  } as FormArray;
  stylesMap = new Map<string, string>([
    ['themeColor', '#0a0'],
    ['foregroundColor', '#efe'],
  ]);
  translationErrorLabelMap = new Map([['LABEL_ERROR_FIELD_REQUIRED', 'Campo obbligatorio']]);
  hasSubmitted = false;
}

describe('FormTextareaComponent', () => {
  let hostFixture: ComponentFixture<FormTextareaHostComponent>;
  let host: FormTextareaHostComponent;
  let textareaEl: HTMLTextAreaElement;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FormTextareaHostComponent, FormTextareaComponent],
      imports: [ReactiveFormsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    hostFixture = TestBed.createComponent(FormTextareaHostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
    textareaEl = hostFixture.nativeElement.querySelector('textarea#c21-prechat-notes') as HTMLTextAreaElement;
  });

  it('should create with label bound to element text and stable id', () => {
    expect(hostFixture.nativeElement.querySelector('chat-form-textarea')).toBeTruthy();
    const label = hostFixture.nativeElement.querySelector('label[for="c21-prechat-notes"]') as HTMLLabelElement;
    expect(label.textContent?.trim()).toBe('Note libere');
    expect(textareaEl).toBeTruthy();
    expect(textareaEl.rows).toBe(5);
    expect(textareaEl.getAttribute('aria-required')).toBe('true');
  });

  it('fieldBaseId should sanitize unsafe characters in element name', () => {
    const inner = hostFixture.debugElement.query(By.directive(FormTextareaComponent)).componentInstance as FormTextareaComponent;
    inner.element = { name: 'a b<c>', text: 'x' } as FormArray;
    expect(inner.fieldBaseId).toBe('c21-prechat-a_b_c_');
  });

  it('should set aria-invalid and show required error when submitted and empty', () => {
    host.hasSubmitted = true;
    hostFixture.detectChanges();
    expect(textareaEl.getAttribute('aria-invalid')).toBe('true');
    expect(textareaEl.getAttribute('aria-describedby')).toBe('c21-prechat-notes-errors');
    const alert = hostFixture.nativeElement.querySelector('#c21-prechat-notes-errors') as HTMLElement;
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.textContent).toContain('Campo obbligatorio');
  });

  it('should show pattern error label when value invalid for pattern', () => {
    host.form.patchValue({ notes: 'lowercase' });
    host.hasSubmitted = true;
    hostFixture.detectChanges();
    const alert = hostFixture.nativeElement.querySelector('#c21-prechat-notes-errors') as HTMLElement;
    expect(alert.textContent).toContain('Solo maiuscole');
  });

  it('onEnterPressed should emit and call preventDefault on handler', () => {
    const innerDe = hostFixture.debugElement.query(By.directive(FormTextareaComponent));
    const inner = innerDe.componentInstance as FormTextareaComponent;
    spyOn(inner.onKeyEnterPressed, 'emit');
    const ev = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(ev, 'preventDefault');
    inner.onEnterPressed(ev);
    expect(ev.preventDefault).toHaveBeenCalled();
    expect(inner.onKeyEnterPressed.emit).toHaveBeenCalledWith(ev);
  });

  it('onkeydown with modifier + Enter should append newline to control value', () => {
    const inner = hostFixture.debugElement.query(By.directive(FormTextareaComponent)).componentInstance as FormTextareaComponent;
    host.form.patchValue({ notes: 'A' });
    const ev = {
      metaKey: true,
      keyCode: 13,
      which: 13,
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any;
    inner.onkeydown(ev);
    expect(host.form.controls.notes.value).toContain('\r\n');
    expect(ev.preventDefault).toHaveBeenCalled();
  });

  it('setFormStyle should toggle form-danger / form-success on wrapper', () => {
    const inner = hostFixture.debugElement.query(By.directive(FormTextareaComponent)).componentInstance as FormTextareaComponent;
    host.form.patchValue({ notes: '' });
    inner.setFormStyle();
    hostFixture.detectChanges();
    const wrap = hostFixture.nativeElement.querySelector('#wrap-c21-prechat-notes') as HTMLElement;
    expect(wrap.classList.contains('form-danger')).toBe(true);
    host.form.patchValue({ notes: 'ABC' });
    inner.setFormStyle();
    expect(wrap.classList.contains('form-success')).toBe(true);
  });

  it('ngOnChanges should set CSS variables from stylesMap on host element', () => {
    const innerDe = hostFixture.debugElement.query(By.directive(FormTextareaComponent));
    const inner = innerDe.componentInstance as FormTextareaComponent;
    inner.ngOnChanges({
      stylesMap: {
        currentValue: host.stylesMap,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    const hostEl: HTMLElement = innerDe.nativeElement;
    expect(hostEl.style.getPropertyValue('--themeColor')).toBe('#0a0');
    expect(hostEl.style.getPropertyValue('--foregroundColor')).toBe('#efe');
  });

  it('fieldBaseId for pre-chat mock fullname matches stable public id prefix', () => {
    const inner = hostFixture.debugElement.query(By.directive(FormTextareaComponent))
      .componentInstance as FormTextareaComponent;
    inner.element = { name: 'userFullname', text: 'Nome' } as FormArray;
    expect(inner.fieldBaseId).toBe('c21-prechat-userFullname');
  });

  it('errorsId should append -errors to fieldBaseId (used with aria-describedby)', () => {
    const inner = hostFixture.debugElement.query(By.directive(FormTextareaComponent))
      .componentInstance as FormTextareaComponent;
    inner.element = clonePrechatFormJsonMock()[1] as FormArray;
    expect(inner.errorsId).toBe('c21-prechat-userEmail-errors');
  });
});
