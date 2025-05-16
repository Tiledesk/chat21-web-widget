import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UserTypingComponent } from './user-typing.component';

describe('UserTypingComponent', () => {
  let component: UserTypingComponent;
  let fixture: ComponentFixture<UserTypingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UserTypingComponent ],
      imports: []
    }).compileComponents();

    fixture = TestBed.createComponent(UserTypingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
