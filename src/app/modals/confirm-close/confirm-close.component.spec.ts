import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmCloseComponent } from './confirm-close.component';

describe('ConfirmCloseComponent', () => {
  let component: ConfirmCloseComponent;
  let fixture: ComponentFixture<ConfirmCloseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmCloseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmCloseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
