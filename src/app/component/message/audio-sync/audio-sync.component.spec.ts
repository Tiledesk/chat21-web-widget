import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioSyncComponent } from './audio-sync.component';
import { TtsAudioPlaybackCoordinator } from 'src/app/providers/tts-audio-playback-coordinator.service';
import { VoiceService } from 'src/app/providers/voice/voice.service';
import { Globals } from 'src/app/utils/globals';

describe('AudioSyncComponent', () => {
  let component: AudioSyncComponent;
  let fixture: ComponentFixture<AudioSyncComponent>;
  let voiceService: { proxyTtsStreamUrl: string | null; proxyTtsUrl: string | null };

  beforeEach(async () => {
    voiceService = {
      proxyTtsStreamUrl: 'https://speech.example.com/api/tts/stream',
      proxyTtsUrl: 'https://speech.example.com/api/tts',
    };

    await TestBed.configureTestingModule({
      imports: [AudioSyncComponent],
      providers: [
        {
          provide: TtsAudioPlaybackCoordinator,
          useValue: {
            requestStart: (_ownerId: string, start: () => void) => start(),
            releaseIfCurrent: jasmine.createSpy('releaseIfCurrent'),
            release: jasmine.createSpy('release'),
            stopAllPlayback$: { subscribe: () => ({ unsubscribe: () => undefined }) },
            preemptPlayback$: { subscribe: () => ({ unsubscribe: () => undefined }) },
          },
        },
        { provide: Globals, useValue: { tiledeskToken: 'JWT test-token', jwt: '' } },
        { provide: VoiceService, useValue: voiceService },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AudioSyncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts TTS playback from the proxy streaming endpoint first', () => {
    component.message = {
      uid: 'm1',
      type: 'tts',
      text: 'hello',
      metadata: {},
      isJustRecived: true,
    } as any;
    const audio = document.createElement('audio');
    const startStreaming = spyOn(component as any, 'startStreamingFromEndpoint').and.stub();

    (component as any).startPlayback(audio);

    expect(startStreaming).toHaveBeenCalledWith(
      audio,
      'https://speech.example.com/api/tts/stream',
      'https://speech.example.com/api/tts',
    );
  });

  it('requests browser-compatible MP3 for proxy REST TTS by default', () => {
    component.message = {
      uid: 'm1',
      type: 'tts',
      text: 'hello',
      metadata: {},
    } as any;

    const body = (component as any).buildTtsRequestBody({});

    expect(body).toEqual({
      text: 'hello',
      streaming: true,
      outputFormat: 'mp3_44100_128',
    });
  });

  it('does not override an explicit TTS outputFormat from message voice settings', () => {
    component.message = {
      uid: 'm1',
      type: 'tts',
      text: 'hello',
      metadata: {},
    } as any;

    const body = (component as any).buildTtsRequestBody({ outputFormat: 'pcm_16000' });

    expect(body).toEqual({
      text: 'hello',
      streaming: true,
      outputFormat: 'pcm_16000',
    });
  });
});
