import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { FormArray } from 'src/chat21-core/models/formArray';
import { FormLabelComponent } from './form-label.component';

@Component({
  template: `
    <form [formGroup]="form">
      <chat-form-label
        [element]="element"
        controlName="intro"
        [hasSubmitted]="hasSubmitted"
      ></chat-form-label>
    </form>`,
})
class FormLabelHostComponent {
  form = new FormBuilder().group({});
  hasSubmitted = false;
  element = {
    name: 'intro',
    type: 'static',
    text: '<strong>Welcome</strong> to support',
    tabIndex: 0,
  } as FormArray;
}

describe('FormLabelComponent', () => {
  let fixture: ComponentFixture<FormLabelHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FormLabelHostComponent, FormLabelComponent],
      imports: [ReactiveFormsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormLabelHostComponent);
    fixture.detectChanges();
  });

  it('should create and bind innerHTML from static field text', () => {
    const host = fixture.nativeElement.querySelector('.c21-header-label label') as HTMLElement;
    expect(host.innerHTML).toContain('<strong>Welcome</strong>');
  });

  it('should assign tabindex from element', () => {
    const host = fixture.nativeElement.querySelector('.c21-header-label label') as HTMLElement;
    expect(host.getAttribute('tabindex')).toBe('0');
  });

  it('should wire FormGroup from parent via FormGroupDirective', () => {
    const inner = fixture.componentInstance;
    const labelComp = fixture.debugElement.query(By.directive(FormLabelComponent))
      .componentInstance as FormLabelComponent;
    expect(labelComp.form).toBe(inner.form);
  });
});
