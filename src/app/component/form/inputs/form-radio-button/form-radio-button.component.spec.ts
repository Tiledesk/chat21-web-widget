import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormRadioButtonComponent } from './form-radio-button.component';

describe('FormRadioButtonComponent', () => {
  let component: FormRadioButtonComponent;
  let fixture: ComponentFixture<FormRadioButtonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FormRadioButtonComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormRadioButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render two radio inputs sharing a name for single-choice semantics', () => {
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(radios.length).toBe(2);
    expect(radios[0].name).toBe(radios[1].name);
  });

  it('should associate each radio with a label via for/id', () => {
    const r1 = fixture.nativeElement.querySelector('#flexRadioDefault1') as HTMLInputElement;
    const r2 = fixture.nativeElement.querySelector('#flexRadioDefault2') as HTMLInputElement;
    const l1 = fixture.nativeElement.querySelector('label[for="flexRadioDefault1"]') as HTMLLabelElement;
    const l2 = fixture.nativeElement.querySelector('label[for="flexRadioDefault2"]') as HTMLLabelElement;
    expect(l1).toBeTruthy();
    expect(l2).toBeTruthy();
    expect(r2.checked).toBe(true);
    expect(r1.checked).toBe(false);
  });
});
