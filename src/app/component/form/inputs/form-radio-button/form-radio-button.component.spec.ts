import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormRadioButtonComponent } from './form-radio-button.component';

describe('RadioButtonComponent', () => {
  let component: FormRadioButtonComponent;
  let fixture: ComponentFixture<FormRadioButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormRadioButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormRadioButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
