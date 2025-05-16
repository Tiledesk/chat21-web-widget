import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConversationInternalFrameComponent } from './conversation-internal-frame.component';

describe('InterlalFrameComponent', () => {
  let component: ConversationInternalFrameComponent;
  let fixture: ComponentFixture<ConversationInternalFrameComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConversationInternalFrameComponent ],
      imports: [
        BrowserAnimationsModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationInternalFrameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
