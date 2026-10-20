import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ConversationAudioRecorderComponent } from './conversation-audio-recorder.component';

describe('ConversationAudioRecorderComponent', () => {
  let component: ConversationAudioRecorderComponent;
  let fixture: ComponentFixture<ConversationAudioRecorderComponent>;
  let stopListeners: { stop?: () => void; data?: (e: { data: Blob }) => void };
  let mediaRecorderInstance: {
    start: jasmine.Spy;
    stop: jasmine.Spy;
    mimeType: string;
    addEventListener: jasmine.Spy;
  };

  beforeEach(async () => {
    stopListeners = {};
    mediaRecorderInstance = {
      start: jasmine.createSpy('start'),
      stop: jasmine.createSpy('stop').and.callFake(() => {
        const fn = stopListeners.stop;
        if (fn) {
          fn();
        }
      }),
      mimeType: 'audio/webm',
      addEventListener: jasmine.createSpy('addEventListener').and.callFake((ev: string, fn: any) => {
        if (ev === 'stop') {
          stopListeners.stop = fn;
        }
        if (ev === 'dataavailable') {
          stopListeners.data = fn;
        }
      }),
    };

    const stream = {
      getTracks: () => [{ stop: jasmine.createSpy('trackStop') }],
    };

    spyOn(window.navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(stream as any));
    (window as any).MediaRecorder = jasmine.createSpy('MediaRecorder').and.returnValue(mediaRecorderInstance);

    await TestBed.configureTestingModule({
      declarations: [ConversationAudioRecorderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConversationAudioRecorderComponent);
    component = fixture.componentInstance;
    component.translationMap = new Map();
    component.stylesMap = new Map();
    spyOn(component.startRecordingEvent, 'emit');
    spyOn(component.endRecordingEvent, 'emit');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('startRecording', () => {
    it('should preventDefault on touchstart', fakeAsync(() => {
      const ev = { type: 'touchstart', preventDefault: jasmine.createSpy('pd') } as any;
      component.startRecording(ev);
      tick();
      expect(ev.preventDefault).toHaveBeenCalled();
      expect(component.startRecordingEvent.emit).toHaveBeenCalled();
    }));

    it('should request microphone and start MediaRecorder on mousedown', fakeAsync(() => {
      const ev = new MouseEvent('mousedown');
      component.startRecording(ev);
      tick();
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(mediaRecorderInstance.start).toHaveBeenCalled();
      expect(component.isRecording).toBe(true);
    }));

    it('should log when getUserMedia fails', fakeAsync(() => {
      (navigator.mediaDevices.getUserMedia as jasmine.Spy).and.returnValue(Promise.reject(new Error('denied')));
      spyOn(console, 'error');
      component.startRecording(new MouseEvent('mousedown'));
      tick();
      expect(console.error).toHaveBeenCalled();
    }));
  });

  describe('stopRecording', () => {
    it('should discard very short press without stopping recorder', fakeAsync(() => {
      component.startTime = Date.now();
      component.stopRecording(new MouseEvent('mouseup'));
      tick(400);
      expect(mediaRecorderInstance.stop).not.toHaveBeenCalled();
    }));

    it('should stop recorder after long press', fakeAsync(() => {
      component.mediaRecorder = mediaRecorderInstance as any;
      component.startTime = Date.now() - 600;
      component.stopRecording(new MouseEvent('mouseup'));
      tick(400);
      expect(mediaRecorderInstance.stop).toHaveBeenCalled();
    }));

    it('should preventDefault on touchend', () => {
      const ev = { type: 'touchend', preventDefault: jasmine.createSpy('pd') } as any;
      component.stopRecording(ev);
      expect(ev.preventDefault).toHaveBeenCalled();
    });
  });

  describe('deleteRecording', () => {
    it('should reset state and emit', () => {
      spyOn(component.deleteRecordingEvent, 'emit');
      component.audioUrl = {} as any;
      component.audioBlob = new Blob();
      component.deleteRecording();
      expect(component.audioUrl).toBeNull();
      expect(component.audioBlob).toBeNull();
      expect(component.deleteRecordingEvent.emit).toHaveBeenCalledWith(null);
    });
  });

  describe('sendMessage', () => {
    it('should emit blob and clear url when recording exists', () => {
      spyOn(component.sendRecordingEvent, 'emit');
      const b = new Blob(['a'], { type: 'audio/webm' });
      component.audioBlob = b;
      component.audioUrl = {} as any;
      component.sendMessage();
      expect(component.sendRecordingEvent.emit).toHaveBeenCalledWith(b);
      expect(component.audioUrl).toBeNull();
    });

    it('should no-op when there is no audioUrl', () => {
      spyOn(component.sendRecordingEvent, 'emit');
      component.audioUrl = null;
      component.sendMessage();
      expect(component.sendRecordingEvent.emit).not.toHaveBeenCalled();
    });
  });
});
