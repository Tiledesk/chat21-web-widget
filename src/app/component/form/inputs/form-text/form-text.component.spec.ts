import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormGroupDirective } from '@angular/forms';

import { FormTextComponent } from './form-text.component';

describe('FormTextComponent', () => {
  let component: FormTextComponent;
  let fixture: ComponentFixture<FormTextComponent>;
  let stylesMap = new Map<string, string>();
  let translationErrorLabelMap = new Map<string, string>();
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FormTextComponent ],
      providers: [ FormGroupDirective ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormTextComponent);
    component = fixture.componentInstance;
    component.stylesMap = stylesMap.set('themeColor', "#2a6ac1")
                                    .set('foregroundColor', "#ffffff")
    component.translationErrorLabelMap = translationErrorLabelMap.set('LABEL_ERROR_FIELD_REQUIRED', "LABEL_ERROR_FIELD_REQUIRED")
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
