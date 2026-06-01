import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { VoiceService } from './voice.service';
import { VadService } from './vad.service';
import { VoiceStreamingService } from './voice-streaming.service';
import { TtsAudioPlaybackCoordinator } from '../tts-audio-playback-coordinator.service';
import { VoiceWsControlMessage } from './voice-streaming.types';

/** Stream con traccia audio reale (Web Audio), richiesto da `createMediaStreamSource` nei test WSS/legacy. */
function createFakeMicStreamWithAudioTrack(): MediaStream {
  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0.00001;
  osc.connect(gain);
  gain.connect(dest);
  osc.start(0);
  return dest.stream;
}

describe('VoiceService', () => {
  let service: VoiceService;
  let vadService: jasmine.SpyObj<VadService>;
  let wsControl$: Subject<VoiceWsControlMessage>;
  let ttsBinaryChunk$: Subject<ArrayBuffer>;
  let voiceStreamingMock: jasmine.SpyObj<VoiceStreamingService>;

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

    wsControl$ = new Subject<VoiceWsControlMessage>();
    ttsBinaryChunk$ = new Subject<ArrayBuffer>();

    voiceStreamingMock = jasmine.createSpyObj<VoiceStreamingService>(
      'VoiceStreamingService',
      ['start', 'stop', 'setAudioMuted', 'sendPlaybackComplete', 'pauseRecording', 'resumeRecording'],
    );
    voiceStreamingMock.start.and.returnValue(Promise.resolve());
    voiceStreamingMock.stop.and.returnValue(
      Promise.resolve({ blob: null, mimeType: '', resultUrl: null }),
    );
    // Expose the subjects as readonly observables via Object.defineProperty
    Object.defineProperty(voiceStreamingMock, 'wsControl$', { get: () => wsControl$.asObservable() });
    Object.defineProperty(voiceStreamingMock, 'ttsBinaryChunk$', { get: () => ttsBinaryChunk$.asObservable() });

    const ttsMock = { isTTSPlaying$: { subscribe: () => ({ unsubscribe: () => undefined }) } };

    TestBed.configureTestingModule({
      providers: [
        VoiceService,
        { provide: VadService, useValue: vadService },
        { provide: VoiceStreamingService, useValue: voiceStreamingMock },
        { provide: TtsAudioPlaybackCoordinator, useValue: ttsMock },
      ],
    });
    service = TestBed.inject(VoiceService);
    spyOn(service as any, '_startKeyboardSound').and.stub();
    spyOn(service as any, '_stopKeyboardSound').and.stub();
  });

  // ── Existing session lifecycle tests ──────────────────────────────────────

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

  it('startSession with voiceIngressStream should not use MicVAD', async () => {
    const stream = createFakeMicStreamWithAudioTrack();
    spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(stream));

    await service.startSession({
      voiceIngressStream: { token: 'JWT x', sender: 'user1', recipient: 'support-group-p1-req1' },
    });

    expect(vadService.ensureOnnxRuntimeEnv).not.toHaveBeenCalled();
    expect(vadService.createMicVad).not.toHaveBeenCalled();
  });

  it('stopSession should destroy VAD and stop tracks', async () => {
    const stream = createFakeMicStreamWithAudioTrack();
    const track = stream.getAudioTracks()[0];
    spyOn(track, 'stop').and.callThrough();
    spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(stream));

    await service.startSession({ onRecordingComplete: () => {} });
    await service.stopSession();

    expect(track.stop).toHaveBeenCalled();
  });

  // ── Playback-gated listening re-enablement tests ──────────────────────────

  /**
   * Start a WSS session and return a helper that tracks _isAcquisitionBlocked$ emissions.
   */
  async function startWssSession(): Promise<boolean[]> {
    const stream = createFakeMicStreamWithAudioTrack();
    spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(stream));
    const blocked: boolean[] = [];
    service.isAcquisitionBlocked$.subscribe((v) => blocked.push(v));
    await service.startSession({
      voiceIngressStream: { token: 'JWT x', sender: 'user1', recipient: 'support-group-p1-req1' },
    });
    return blocked;
  }

  it('acquisition stays blocked after _flushTtsUnblock; unblocks only on "listening"', async () => {
    const blocked = await startWssSession();
    const initialLen = blocked.length;

    // Simulate proxy sequence: speaking → binary audio → done
    wsControl$.next({ event: 'speaking', text: 'hello' } as VoiceWsControlMessage);
    // Emit a tiny audio buffer so _activeTtsSources increments
    ttsBinaryChunk$.next(new ArrayBuffer(4));
    wsControl$.next({ event: 'done' } as VoiceWsControlMessage);

    // sendPlaybackComplete must NOT have been called yet (audio hasn't ended)
    expect(voiceStreamingMock.sendPlaybackComplete).not.toHaveBeenCalled();

    // _isAcquisitionBlocked$ must still be true — no premature unblock
    const afterDone = blocked.slice(initialLen);
    expect(afterDone.every((v) => v === true)).toBeTrue();

    // Now simulate "listening" arriving from proxy
    wsControl$.next({ event: 'listening' } as VoiceWsControlMessage);

    const afterListening = blocked[blocked.length - 1];
    expect(afterListening).toBeFalse();
    expect(voiceStreamingMock.setAudioMuted).not.toHaveBeenCalled();
  });

  it('empty-audio path: sendPlaybackComplete after flush but acquisition stays blocked until "listening"', async () => {
    const blocked = await startWssSession();
    const initialLen = blocked.length;

    // done with no binary audio arms unblock; flush sends playback complete to proxy
    wsControl$.next({ event: 'speaking', text: 'hello' } as VoiceWsControlMessage);
    wsControl$.next({ event: 'done' } as VoiceWsControlMessage);

    expect(voiceStreamingMock.sendPlaybackComplete).not.toHaveBeenCalled();
    (service as any)._flushTtsUnblock(false);
    expect(voiceStreamingMock.sendPlaybackComplete).toHaveBeenCalledTimes(1);

    const afterDone = blocked.slice(initialLen);
    expect(afterDone.every((v) => v === true)).toBeTrue();

    wsControl$.next({ event: 'listening' } as VoiceWsControlMessage);
    expect(blocked[blocked.length - 1]).toBeFalse();
  });

  it('"listening" event unblocks acquisition without mic mute toggles (AEC keeps capture open)', async () => {
    await startWssSession();

    wsControl$.next({ event: 'speaking', text: 'hi' } as VoiceWsControlMessage);
    wsControl$.next({ event: 'done' } as VoiceWsControlMessage);
    wsControl$.next({ event: 'listening' } as VoiceWsControlMessage);

    expect(voiceStreamingMock.setAudioMuted).not.toHaveBeenCalled();
    expect((service as any)._isAcquisitionBlocked$.getValue()).toBe(false);
  });

  // ── Audio preemption tests (SPEC-002) ────────────────────────────────────

  it('second "speaking" cancels first audio: sendPlaybackComplete only after flush for the new turn', async () => {
    await startWssSession();
    voiceStreamingMock.sendPlaybackComplete.calls.reset();

    wsControl$.next({ event: 'speaking', text: 'first' } as VoiceWsControlMessage);
    ttsBinaryChunk$.next(new ArrayBuffer(4));
    wsControl$.next({ event: 'done' } as VoiceWsControlMessage);

    wsControl$.next({ event: 'speaking', text: 'second' } as VoiceWsControlMessage);
    wsControl$.next({ event: 'done' } as VoiceWsControlMessage);

    expect(voiceStreamingMock.sendPlaybackComplete).not.toHaveBeenCalled();
    (service as any)._flushTtsUnblock(false);
    expect(voiceStreamingMock.sendPlaybackComplete).toHaveBeenCalledTimes(1);
  });

  it('second "speaking" resets counters so first audio ending does not trigger spurious sendPlaybackComplete', async () => {
    await startWssSession();
    voiceStreamingMock.sendPlaybackComplete.calls.reset();

    wsControl$.next({ event: 'speaking', text: 'first' } as VoiceWsControlMessage);
    ttsBinaryChunk$.next(new ArrayBuffer(4));
    wsControl$.next({ event: 'done' } as VoiceWsControlMessage);

    // Preempt
    wsControl$.next({ event: 'speaking', text: 'second' } as VoiceWsControlMessage);

    // Simulate first audio's onended firing AFTER the cancel (delayed Web Audio callback).
    (service as any)._onTtsSourceEnded();

    // _unblockAfterTts was cleared by cancel; no sendPlaybackComplete should fire
    expect(voiceStreamingMock.sendPlaybackComplete).not.toHaveBeenCalled();
  });

});
