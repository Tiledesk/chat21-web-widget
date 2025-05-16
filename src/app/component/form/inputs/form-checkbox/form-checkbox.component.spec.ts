import { style } from '@angular/animations';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroupDirective } from '@angular/forms';

import { FormCheckboxComponent } from './form-checkbox.component';

describe('FormCheckboxComponent', () => {
  let component: FormCheckboxComponent;
  let fixture: ComponentFixture<FormCheckboxComponent>;
  let stylesMap = new Map<string, string>();
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FormCheckboxComponent ],
      providers: [ FormGroupDirective ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormCheckboxComponent);
    component = fixture.componentInstance;
    component.stylesMap = stylesMap.set('themeColor', "#2a6ac1")
                                    .set('foregroundColor', "#ffffff")
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
