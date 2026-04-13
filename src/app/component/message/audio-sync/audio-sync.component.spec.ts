import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioSyncComponent } from './audio-sync.component';

describe('AudioSyncComponent', () => {
  let component: AudioSyncComponent;
  let fixture: ComponentFixture<AudioSyncComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioSyncComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AudioSyncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
