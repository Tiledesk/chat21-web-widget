import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LikeUnlikeComponent } from './like-unlike.component';

describe('LikeUnlikeComponent', () => {
  let component: LikeUnlikeComponent;
  let fixture: ComponentFixture<LikeUnlikeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LikeUnlikeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LikeUnlikeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
