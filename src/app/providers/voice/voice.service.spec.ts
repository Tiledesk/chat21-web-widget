import { TestBed } from '@angular/core/testing';

import { VoiceService } from './voice.service';
import { VadService } from './vad.service';

describe('VoiceService', () => {
  let service: VoiceService;
  let vadService: jasmine.SpyObj<VadService>;

  let mockVad: { start: jasmine.Spy; pause: jasmine.Spy; destroy: jasmine.Spy };

  beforeEach(() => {
    mockVad = {
      start: jasmine.createSpy('start').and.returnValue(Promise.resolve()),
      pause: jasmine.createSpy('pause').and.returnValue(Promise.resolve()),
      destroy: jasmine.createSpy('destroy').and.returnValue(Promise.resolve()),
    };
    vadService = jasmine.createSpyObj('VadService', ['ensureOnnxRuntimeEnv', 'createMicVad']);
    vadService.ensureOnnxRuntimeEnv.and.returnValue(Promise.resolve());
    vadService.createMicVad.and.returnValue(Promise.resolve(mockVad as any));

    TestBed.configureTestingModule({
      providers: [VoiceService, { provide: VadService, useValue: vadService }],
    });
    service = TestBed.inject(VoiceService);
  });

  it('startSession should call ensureOnnxRuntimeEnv', async () => {
    const stream = new MediaStream();
    spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(stream));

    await service.startSession({});

    expect(vadService.ensureOnnxRuntimeEnv).toHaveBeenCalled();
  });

  it('startSession should request mic, create MicVAD, and start', async () => {
    const stream = new MediaStream();
    spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(stream));

    await service.startSession({
      onRecordingComplete: () => {},
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    expect(vadService.createMicVad).toHaveBeenCalled();
    expect(mockVad.start).toHaveBeenCalled();
  });

  it('stopSession should destroy VAD and stop tracks', async () => {
    const track = jasmine.createSpyObj<MediaStreamTrack>('MediaStreamTrack', ['stop']);
    const stream = new MediaStream([track]);
    spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(stream));

    await service.startSession({ onRecordingComplete: () => {} });
    await service.stopSession();

    expect(track.stop).toHaveBeenCalled();
  });
});
