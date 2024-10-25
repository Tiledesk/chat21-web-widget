import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationAudioRecorderComponent } from './conversation-audio-recorder.component';

describe('AudioRecorderComponent', () => {
  let component: ConversationAudioRecorderComponent;
  let fixture: ComponentFixture<ConversationAudioRecorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConversationAudioRecorderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConversationAudioRecorderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
