import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SendButtonComponent } from './send-button.component';

describe('SendButtonComponent', () => {
  let component: SendButtonComponent;
  let fixture: ComponentFixture<SendButtonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SendButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SendButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
