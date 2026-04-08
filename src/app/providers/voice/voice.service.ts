import { Inject, Injectable, Optional } from '@angular/core';
import type { MicVAD } from '@ricky0123/vad-web';
import { getDefaultRealTimeVADOptions } from '@ricky0123/vad-web';
import { Observable, Subject } from 'rxjs';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';

import {
  DEFAULT_VOICE_MEDIA_STREAM_CONSTRAINTS,
  VoiceSegmentPayload,
  VoiceSessionStartOptions,
} from './audio.types';
import { SpeechToTextProvider } from './STT&TTS/speech-provider.abstract';
import { VadService } from './vad.service';

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

  private readonly logger: LoggerService = LoggerInstance.getInstance();

  constructor(
    private readonly vadService: VadService,
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

    const vadDefaults = getDefaultRealTimeVADOptions('legacy');

    this.vad = await this.vadService.createMicVad({
      getStream: async () => this.stream as MediaStream,
      pauseStream: vadDefaults.pauseStream,
      resumeStream: async () => {
        this.stream = await navigator.mediaDevices.getUserMedia(this.sessionConstraints);
        return this.stream;
      },
      onSpeechStart: () => {
        this.logger.log('[VoiceService] speech start');
        this.startMediaRecorderSegment();
      },
      onSpeechEnd: (_pcm: Float32Array) => {
        this.logger.log('[VoiceService] speech end');
        this.stopMediaRecorderSegment();
      },
      minSpeechMs: 480,
      redemptionMs: 1920,
      preSpeechPadMs: 960,
    });

    await this.vad.start();
  }

  async stopSession(): Promise<void> {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
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

    this.onRecordingComplete = undefined;
  }

  private startMediaRecorderSegment(): void {
    if (this.mediaRecorder?.state === 'recording') {
      return;
    }
    if (!this.stream) {
      return;
    }

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

  private stopMediaRecorderSegment(): void {
    if (!this.mediaRecorder) {
      return;
    }

    this.mediaRecorder.stop();

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.audioChunks, { type: VOICE_RECORDING_MIME });
      void this.finalizeSegment(blob, VOICE_RECORDING_MIME);
    };
  }

  private async finalizeSegment(blob: Blob, mimeType: string): Promise<void> {
    const base: VoiceSegmentPayload = { blob, mimeType };
    const runStt = this.enableTranscription && this.speechToText && blob.size > 0;

    if (!runStt) {
      this.emitSegmentPayload(base);
      return;
    }

    try {
      const { text } = await this.speechToText.transcribe({ audio: blob, mimeType });
      this.emitSegmentPayload({ ...base, transcript: text });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.log('[VoiceService] transcription failed', msg);
      this.emitSegmentPayload({ ...base, transcriptionError: msg });
    }
  }

  private emitSegmentPayload(payload: VoiceSegmentPayload): void {
    this.logger.log('[VoiceService] segment ready', payload.transcript ?? payload.transcriptionError ?? payload.blob.size);
    this.audioSegmentSubject.next(payload);
    const cb = this.onRecordingComplete;
    if (cb) {
      cb(payload);
    }
  }
}
