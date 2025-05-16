import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormGroupDirective } from '@angular/forms';

import { FormLabelComponent } from './form-label.component';

describe('FormLabelComponent', () => {
  let component: FormLabelComponent;
  let fixture: ComponentFixture<FormLabelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FormLabelComponent ],
      providers: [ FormGroupDirective ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
