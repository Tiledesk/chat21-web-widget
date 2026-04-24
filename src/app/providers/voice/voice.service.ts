import { Inject, Injectable, Optional } from '@angular/core';
import type { MicVAD } from '@ricky0123/vad-web';
import { getDefaultRealTimeVADOptions } from '@ricky0123/vad-web';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';

import {
  DEFAULT_VOICE_MEDIA_STREAM_CONSTRAINTS,
  VoiceSegmentPayload,
  VoiceSessionStartOptions,
} from './audio.types';
import { SpeechToTextProvider } from './STT&TTS/speech-provider.abstract';
import { VadService } from './vad.service';
import { TtsAudioPlaybackCoordinator } from '../tts-audio-playback-coordinator.service';

const VOICE_RECORDING_MIME = 'audio/webm';

/**
 * Voce: VadService (ONNX WASM) → MicVAD → MediaRecorder su ogni segmento parlato.
 * Opzionalmente STT (`SpeechToTextProvider`) arricchisce il payload con `transcript`.
 */
@Injectable({ providedIn: 'root' })
export class VoiceService {
  private vad?: MicVAD;
  private stream?: MediaStream;
  private mediaRecorder?: MediaRecorder;
  private audioChunks: Blob[] = [];
  private sessionConstraints: MediaStreamConstraints = DEFAULT_VOICE_MEDIA_STREAM_CONSTRAINTS;
  private onRecordingComplete?: (result: VoiceSegmentPayload) => void;
  private enableTranscription = true;

  private readonly audioSegmentSubject = new Subject<VoiceSegmentPayload>();
  /** Emesso a ogni fine segmento parlato: audio WebM + opzionalmente `transcript` / `transcriptionError`. */
  readonly audioSegment$: Observable<VoiceSegmentPayload> = this.audioSegmentSubject.asObservable();

  // 🔊 REALTIME VOLUME STREAM
  private readonly volumeSubject = new BehaviorSubject<number>(0);
  readonly volume$: Observable<number> = this.volumeSubject.asObservable();

  // 🎙️ TTS GATE — suppresses segment emission while TTS is playing
  private isTTSActive = false;
  private ttsGateSub?: Subscription;

  // 🎧 AUDIO ANALYSER
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  /** Buffer dedicato (`ArrayBuffer`) per compatibilità con `getByteFrequencyData`. */
  private dataArray?: Uint8Array;

  private readonly logger: LoggerService = LoggerInstance.getInstance();

  constructor(
    private readonly vadService: VadService,
    private readonly ttsPlayback: TtsAudioPlaybackCoordinator,
    @Optional() @Inject(SpeechToTextProvider) private readonly speechToText: SpeechToTextProvider | null,
  ) {}

  get isSessionActive(): boolean {
    return !!this.vad || !!this.stream;
  }

  /**
   * Richiede il microfono, avvia VAD in ascolto (inizio/fine parlato) e registra in WebM per segmento.
   */
  async startSession(options: VoiceSessionStartOptions = {}): Promise<void> {
    await this.stopSession();

    this.sessionConstraints = options.constraints ?? DEFAULT_VOICE_MEDIA_STREAM_CONSTRAINTS;
    this.onRecordingComplete = options.onRecordingComplete;
    this.enableTranscription = options.enableTranscription !== false;

    await this.vadService.ensureOnnxRuntimeEnv();

    this.stream = await navigator.mediaDevices.getUserMedia(this.sessionConstraints);

    // 🎧 AUDIO ANALYSER INIT
    this.initAudioAnalyser(this.stream);

    const vadDefaults = getDefaultRealTimeVADOptions('legacy');

    this.vad = await this.vadService.createMicVad({
      getStream: async () => this.stream as MediaStream,
      pauseStream: vadDefaults.pauseStream,
      resumeStream: async () => {
        this.stream = await navigator.mediaDevices.getUserMedia(this.sessionConstraints);
        this.initAudioAnalyser(this.stream);
        return this.stream;
      },
      onSpeechStart: () => {
        this.logger.log('[VoiceService] speech start');
        this.startMediaRecorderSegment();
      },
      onSpeechEnd: () => {
        this.logger.log('[VoiceService] speech end');
        this.stopMediaRecorderSegment();
      },
      minSpeechMs: 480,
      redemptionMs: 1920,
      preSpeechPadMs: 960,
    });

    await this.vad.start();

    // 🔁 start volume loop
    this.startVolumeLoop();

    // 🎙️ gate segments while TTS is playing
    this.ttsGateSub = this.ttsPlayback.isTTSPlaying$.subscribe((playing) => {
      this.isTTSActive = playing;
      this.logger.log('[VoiceService] TTS gate', playing ? 'closed (bot speaking)' : 'open (listening)');
    });
  }

  /**
   * @param options.discardInProgressSegment — non inviare STT/upload per il segmento WebM corrente (es. interruzione da messaggio in arrivo).
   */
  async stopSession(options?: { discardInProgressSegment?: boolean }): Promise<void> {
    const discard = options?.discardInProgressSegment === true;

    if (this.mediaRecorder) {
      if (discard) {
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.ondataavailable = null;
      }
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
    }

    this.mediaRecorder = undefined;
    this.audioChunks = [];

    if (this.vad) {
      try {
        await this.vad.pause();
        await this.vad.destroy();
      } catch (e) {
        this.logger.log('[VoiceService] stopSession VAD cleanup', e);
      }
      this.vad = undefined;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = undefined;
    }

    // 🎧 cleanup audio context
    this.audioContext?.close();
    this.audioContext = undefined;
    this.analyser = undefined;
    this.dataArray = undefined;

    this.volumeSubject.next(0);

    this.onRecordingComplete = undefined;

    // 🎙️ release TTS gate subscription
    this.ttsGateSub?.unsubscribe();
    this.ttsGateSub = undefined;
    this.isTTSActive = false;
  }

  /**
   * Scarta il segmento WebM in corso (nessun upload/STT) senza chiudere VAD, mic o sessione.
   * Lo stream resta in ascolto per il prossimo `onSpeechStart`.
   */
  discardCurrentRecordingSegment(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.ondataavailable = null;
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
    }
    this.mediaRecorder = undefined;
    this.audioChunks = [];
    this.logger.log('[VoiceService] discarded in-progress segment; VAD session unchanged');
  }

  /**
   * 🎧 AUDIO ANALYSER INIT
   */
  private initAudioAnalyser(stream: MediaStream): void {
    this.audioContext = new AudioContext();

    const source = this.audioContext.createMediaStreamSource(stream);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    const bins = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(new ArrayBuffer(bins));

    source.connect(this.analyser);
  }

  /**
   * 🔁 VOLUME LOOP
   */
  private startVolumeLoop(): void {
    const tick = () => {
      if (!this.analyser || !this.dataArray) {
        requestAnimationFrame(tick);
        return;
      }

      this.analyser.getByteFrequencyData(
        this.dataArray as Parameters<AnalyserNode['getByteFrequencyData']>[0],
      );

      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }

      const volume = sum / this.dataArray.length;

      this.volumeSubject.next(volume);

      requestAnimationFrame(tick);
    };

    tick();
  }

  /**
   * 🎙️ RECORD SEGMENT START
   */
  private startMediaRecorderSegment(): void {
    if (this.mediaRecorder?.state === 'recording') return;
    if (!this.stream) return;

    this.audioChunks = [];

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: VOICE_RECORDING_MIME,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
  }

  /**
   * 🛑 RECORD SEGMENT STOP
   */
  private stopMediaRecorderSegment(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.stop();

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.audioChunks, {
        type: VOICE_RECORDING_MIME,
      });

      void this.finalizeSegment(blob, VOICE_RECORDING_MIME);
    };
  }

  /**
   * 🧠 FINALIZE SEGMENT (STT optional)
   */
  private async finalizeSegment(blob: Blob, mimeType: string): Promise<void> {
    const base: VoiceSegmentPayload = { blob, mimeType };

    const runStt =
      this.enableTranscription &&
      !!this.speechToText &&
      blob.size > 0;

    if (!runStt) {
      this.emitSegmentPayload(base);
      return;
    }

    try {
      const { text } = await this.speechToText.transcribe({
        audio: blob,
        mimeType,
      });

      this.emitSegmentPayload({ ...base, transcript: text });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.log('[VoiceService] transcription failed', msg);

      this.emitSegmentPayload({
        ...base,
        transcriptionError: msg,
      });
    }
  }

  /**
   * 📡 EMIT RESULT
   */
  private emitSegmentPayload(payload: VoiceSegmentPayload): void {
    if (this.isTTSActive) {
      this.logger.log('[VoiceService] segment suppressed — TTS is playing');
      return;
    }

    this.logger.log( '[VoiceService] segment ready', payload.transcript ?? payload.transcriptionError ?? payload.blob.size);

    this.audioSegmentSubject.next(payload);

    this.onRecordingComplete?.(payload);
  }
}
