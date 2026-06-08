import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { NGXLogger } from 'ngx-logger';

import { AudioComponent } from './audio.component';

describe('AudioComponent', () => {
  let component: AudioComponent;
  let fixture: ComponentFixture<AudioComponent>;
  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
  const customLogger = new CustomLogger(ngxlogger);
  const arrayBuf = new ArrayBuffer(64);

  const fakeBuffer = {
    duration: 90,
    getChannelData: () => new Float32Array(4000),
  } as unknown as AudioBuffer;

  beforeEach(async () => {
    LoggerInstance.setInstance(customLogger);
    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(arrayBuf),
      } as Response),
    );
    spyOn(AudioContext.prototype, 'decodeAudioData').and.returnValue(Promise.resolve(fakeBuffer));

    await TestBed.configureTestingModule({
      declarations: [AudioComponent],
    })
      .overrideComponent(AudioComponent, {
        set: {
          template: `
            <div class="audio-container">
              <div class="audio-track"></div>
              <div class="audio-player-custom">
                <audio #audioElement></audio>
                <canvas #canvasElement width="120" height="32"></canvas>
              </div>
            </div>`,
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AudioComponent);
    component = fixture.componentInstance;
    component.stylesMap = new Map<string, string>([
      ['bubbleSentBackground', 'rgba(10, 20, 30, 1)'],
      ['bubbleSentTextColor', '#112233'],
    ]);
    component.color = '#000000';
  });

  it('should create', async () => {
    const blob = new Blob([new Uint8Array(arrayBuf.byteLength)], { type: 'audio/wav' });
    component.audioBlob = blob;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('formatTime should pad seconds under 10', () => {
    expect(component.formatTime(0)).toBe('0:00');
    expect(component.formatTime(9)).toBe('0:09');
    expect(component.formatTime(70)).toBe('1:10');
  });

  it('extractFirstColor should parse first rgba from gradient string', () => {
    expect(component.extractFirstColor('linear-gradient(rgba(1, 2, 3, 0.5), red)')).toBe('rgba(1, 2, 3, 0.5)');
    expect(component.extractFirstColor('no-color')).toBeNull();
  });

  it('drawWaveform should return early when canvas context missing', () => {
    const canvas = document.createElement('canvas');
    spyOn(canvas, 'getContext').and.returnValue(null);
    (component as any).waveformCanvas = { nativeElement: canvas };
    (component as any).audioBuffer = fakeBuffer;
    (component as any).audioDuration = 10;
    (component as any).audioElement = {
      nativeElement: { currentTime: 0, paused: true },
    };
    expect(() => component.drawWaveform(fakeBuffer)).not.toThrow();
  });

  it('drawWaveform should render bars when context exists', () => {
    const fillRect = jasmine.createSpy('fillRect');
    const clearRect = jasmine.createSpy('clearRect');
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 40;
    spyOn(canvas, 'getContext').and.returnValue({ fillRect, clearRect } as any);
    (component as any).waveformCanvas = { nativeElement: canvas };
    (component as any).audioElement = {
      nativeElement: { currentTime: 0, paused: true },
    };
    (component as any).audioDuration = 10;
    component.drawWaveform(fakeBuffer);
    expect(clearRect).toHaveBeenCalled();
    expect(fillRect).toHaveBeenCalled();
  });

  it('ngAfterViewInit with blob should wire object URL and CSS vars', async () => {
    const blob = new Blob([new Uint8Array(128)], { type: 'audio/wav' });
    component.audioBlob = blob;
    spyOn(URL, 'createObjectURL').and.returnValue('blob:mock-audio');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.rawAudioUrl).toBe('blob:mock-audio');
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it('ngAfterViewInit with metadata.src should fetch and decode', async () => {
    component.audioBlob = null;
    component.metadata = { src: 'blob:from-meta' };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(window.fetch).toHaveBeenCalled();
    expect(component.audioDuration).toBe(90);
  });

  it('playPauseAudio should toggle play state when buffer ready', () => {
    spyOn(window, 'requestAnimationFrame').and.stub();
    (component as any).audioBuffer = fakeBuffer;
    (component as any).audioDuration = 10;
    const play = jasmine.createSpy('play').and.returnValue(Promise.resolve());
    const pause = jasmine.createSpy('pause');
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 32;
    spyOn(canvas, 'getContext').and.returnValue({
      fillRect: jasmine.createSpy(),
      clearRect: jasmine.createSpy(),
    } as any);
    (component as any).waveformCanvas = { nativeElement: canvas };
    (component as any).audioElement = {
      nativeElement: { paused: true, currentTime: 0, play, pause, ontimeupdate: null as any, onended: null as any },
    };
    (component as any).audioContext = { resume: jasmine.createSpy().and.returnValue(Promise.resolve()) };

    component.playPauseAudio();
    expect(play).toHaveBeenCalled();
    expect(component.isPlaying).toBe(true);

    (component as any).audioElement.nativeElement.paused = false;
    component.playPauseAudio();
    expect(pause).toHaveBeenCalled();
  });

  it('getAudioDuration should set audioDuration from decoded buffer', async () => {
    component.metadata = { src: 'blob:x' };
    await component.getAudioDuration();
    expect(component.audioDuration).toBe(90);
  });
});
