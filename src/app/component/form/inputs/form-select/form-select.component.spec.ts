import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormSelectComponent } from './form-select.component';

describe('FormSelectComponent', () => {
  let component: FormSelectComponent;
  let fixture: ComponentFixture<FormSelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FormSelectComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render placeholder copy until a real select is implemented', () => {
    const p = fixture.nativeElement.querySelector('p') as HTMLParagraphElement;
    expect(p.textContent?.trim()).toBe('select works!');
  });

  it('ngOnInit should complete without throwing', () => {
    expect(() => component.ngOnInit()).not.toThrow();
  });
});
