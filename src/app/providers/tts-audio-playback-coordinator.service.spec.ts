import { TtsAudioPlaybackCoordinator } from './tts-audio-playback-coordinator.service';

describe('TtsAudioPlaybackCoordinator', () => {
  let coordinator: TtsAudioPlaybackCoordinator;

  beforeEach(() => {
    coordinator = new TtsAudioPlaybackCoordinator();
  });

  // ── Basic lifecycle ───────────────────────────────────────────────────────

  it('should start playing immediately when nothing is active', () => {
    const start = jasmine.createSpy('start');
    coordinator.requestStart('msg-1', start);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('isTTSPlaying$ should be true while playing and false after release', () => {
    const states: boolean[] = [];
    coordinator.isTTSPlaying$.subscribe((v) => states.push(v));

    coordinator.requestStart('msg-1', () => {});
    coordinator.releaseIfCurrent('msg-1');

    expect(states).toEqual([false, true, false]);
  });

  it('stopAll clears the queue, sets playing=false, and emits stopAllPlayback$', () => {
    const stopAllFired: void[] = [];
    coordinator.stopAllPlayback$.subscribe(() => stopAllFired.push(undefined));

    coordinator.requestStart('msg-1', () => {});
    coordinator.stopAll();

    let playing = true;
    coordinator.isTTSPlaying$.subscribe((v) => (playing = v));
    expect(playing).toBe(false);
    expect(stopAllFired.length).toBe(1);
  });

  // ── Preemption tests (SPEC-002) ───────────────────────────────────────────

  it('requestStart while playing preempts old owner: new start() is called immediately', () => {
    const start1 = jasmine.createSpy('start1');
    const start2 = jasmine.createSpy('start2');

    coordinator.requestStart('msg-1', start1);
    coordinator.requestStart('msg-2', start2);

    expect(start1).toHaveBeenCalledTimes(1);
    expect(start2).toHaveBeenCalledTimes(1); // started immediately, not queued
  });

  it('preemptPlayback$ emits evicted ownerId only (not the new owner)', () => {
    const preempted: string[] = [];
    coordinator.preemptPlayback$.subscribe((id) => preempted.push(id));

    coordinator.requestStart('msg-1', () => {});
    coordinator.requestStart('msg-2', () => {}); // preempts msg-1

    expect(preempted).toEqual(['msg-1']);
  });

  it('preemptPlayback$ does NOT emit the new owner id', () => {
    const preempted: string[] = [];
    coordinator.preemptPlayback$.subscribe((id) => preempted.push(id));

    coordinator.requestStart('msg-1', () => {});
    coordinator.requestStart('msg-2', () => {});

    expect(preempted).not.toContain('msg-2');
  });

  it('isTTSPlaying$ stays true after preemption until new owner releases', () => {
    const states: boolean[] = [];
    coordinator.isTTSPlaying$.subscribe((v) => states.push(v));

    coordinator.requestStart('msg-1', () => {});   // true
    coordinator.requestStart('msg-2', () => {});   // still true (preemption, new owner active)
    coordinator.releaseIfCurrent('msg-2');          // false

    expect(states).toEqual([false, true, false]);
  });

  it('releaseIfCurrent for an evicted owner is a no-op', () => {
    const states: boolean[] = [];
    coordinator.isTTSPlaying$.subscribe((v) => states.push(v));

    coordinator.requestStart('msg-1', () => {});
    coordinator.requestStart('msg-2', () => {}); // msg-1 evicted

    // Old owner calls release after being preempted — should not affect playing state
    coordinator.releaseIfCurrent('msg-1');

    expect(states).toEqual([false, true]); // no extra false emission
  });

  it('chain of preemptions: each new requestStart immediately evicts the current owner', () => {
    const preempted: string[] = [];
    coordinator.preemptPlayback$.subscribe((id) => preempted.push(id));

    coordinator.requestStart('msg-1', () => {});
    coordinator.requestStart('msg-2', () => {});
    coordinator.requestStart('msg-3', () => {});

    expect(preempted).toEqual(['msg-1', 'msg-2']);
  });

  it('requestStart is idempotent for the current owner', () => {
    const start = jasmine.createSpy('start');
    coordinator.requestStart('msg-1', start);
    coordinator.requestStart('msg-1', start); // same owner — should be ignored

    expect(start).toHaveBeenCalledTimes(1);
  });
});
