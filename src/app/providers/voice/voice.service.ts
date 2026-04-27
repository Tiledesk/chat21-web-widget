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
import { VoiceStreamingService } from './voice-streaming.service';
import { VoiceStreamingSessionConfig, VoiceWsControlMessage } from './voice-streaming.types';
import { TtsAudioPlaybackCoordinator } from '../tts-audio-playback-coordinator.service';

const VOICE_RECORDING_MIME = 'audio/webm';

/**
 * Due modalità:
 * - **Ingresso WSS** (`voiceIngressStream`): microfono → proxy in streaming; niente VAD locale — silenzio/turni gestiti dal server.
 *   Eventi `transcript` / TTS binario arrivano sulla WSS.
 * - **Legacy**: MicVAD + segmenti WebM (upload/STT client-side) se non passi `voiceIngressStream`.
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
  private voiceIngressConfig: VoiceStreamingSessionConfig | null = null;

  private readonly audioSegmentSubject = new Subject<VoiceSegmentPayload>();
  
  private readonly speechStartSubject = new Subject<void>();
  /** Emesso quando il microfono intercetta parlato (VAD speech start). */
  readonly speechStart$: Observable<void> = this.speechStartSubject.asObservable();

  private readonly speechEndSubject = new Subject<void>();
  /** Emesso quando il parlato termina (VAD speech end). */
  readonly speechEnd$: Observable<void> = this.speechEndSubject.asObservable();

  /** Trascrizione dall’evento WSS `transcript` (proxy). */
  private readonly voiceTranscriptSubject = new Subject<{ text: string; isFinal: boolean }>();
  readonly voiceTranscript$: Observable<{ text: string; isFinal: boolean }> = this.voiceTranscriptSubject.asObservable();

  private readonly volumeSubject = new BehaviorSubject<number>(0);
  readonly volume$: Observable<number> = this.volumeSubject.asObservable();

  // 🎙️ TTS GATE — suppresses segment emission while TTS is playing
  private isTTSActive = false;
  private ttsGateSub?: Subscription;
  private wsControlSub?: Subscription;
  private ttsChunkSub?: Subscription;

  // 🚫 ACQUISITION GATE — pauses VAD from speech-end until TTS response cycle completes
  private isWaitingForResponse = false;
  private responseTimeoutId?: ReturnType<typeof setTimeout>;
  private readonly _isAcquisitionBlocked$ = new BehaviorSubject<boolean>(false);
  /** Emits `true` from user speech-end until VAD resumes after TTS finishes; drives the grey orb. */
  readonly isAcquisitionBlocked$: Observable<boolean> = this._isAcquisitionBlocked$.asObservable();

  // 🎧 AUDIO ANALYSER
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  /** Buffer dedicato (`ArrayBuffer`) per compatibilità con `getByteFrequencyData`. */
  private dataArray?: Uint8Array;

  /** Riproduzione chunk TTS binari dal proxy (Web Audio). */
  private ttsPlayContext?: AudioContext;
  private ttsNextPlayTime = 0;

  private readonly logger: LoggerService = LoggerInstance.getInstance();

  constructor(
    private readonly vadService: VadService,
    private readonly ttsPlayback: TtsAudioPlaybackCoordinator,
    private readonly voiceStreaming: VoiceStreamingService,
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
    this.voiceIngressConfig = options.voiceIngressStream;

    if (this.voiceIngressConfig) {
      await this.startWssVoiceSession();
      return;
    }

    await this.startLegacyVadSession(options);
  }

  /** Sessione guidata dal proxy: solo mic + volume + WSS (mic in upload, eventi + TTS in download). */
  private async startWssVoiceSession(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia(this.sessionConstraints);

    // 🎧 AUDIO ANALYSER INIT
    this.initAudioAnalyser(this.stream);
    this.startVolumeLoop();

    try {
      await this.voiceStreaming.start(this.voiceIngressConfig!, { sharedMediaStream: this.stream });
      this.logger.log('[VoiceService] sessione WSS (nessun VAD locale)');
    } catch (e) {
      this.voiceIngressConfig = null;
      if (this.stream) {
        this.stream.getTracks().forEach((t) => t.stop());
        this.stream = undefined;
      }
      this.audioContext?.close();
      this.audioContext = undefined;
      this.analyser = undefined;
      this.dataArray = undefined;
      throw e;
    }

    this.wsControlSub = this.voiceStreaming.wsControl$.subscribe((msg) => this.onWsControl(msg));
    this.ttsChunkSub = this.voiceStreaming.ttsBinaryChunk$.subscribe((buf) => void this.playWsTtsChunk(buf));
  }

  /** VAD + segmenti (nessun ingresso WSS). */
  private async startLegacyVadSession(options: VoiceSessionStartOptions): Promise<void> {
    await this.vadService.ensureOnnxRuntimeEnv();

    this.stream = await navigator.mediaDevices.getUserMedia(this.sessionConstraints);
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
        this.speechStartSubject.next();
        this.startMediaRecorderSegment();
      },
      onSpeechEnd: () => {
        this.logger.log('[VoiceService] speech end');
        this.speechEndSubject.next();
        this.stopMediaRecorderSegment();
        // Pause VAD immediately — new recordings are blocked until the TTS response cycle completes.
        this.isWaitingForResponse = true;
        this._isAcquisitionBlocked$.next(true);
        this.setResponseSafetyTimeout();
        void this.vad?.pause();
      },
      minSpeechMs: 480,
      redemptionMs: 1920,
      preSpeechPadMs: 960,
    });

    await this.vad.start();

    // 🔁 start volume loop
    this.startVolumeLoop();

    // 🎙️ gate segments while TTS is playing; resume VAD when TTS cycle completes
    this.ttsGateSub = this.ttsPlayback.isTTSPlaying$.subscribe((playing) => {
      this.isTTSActive = playing;
      this.logger.log('[VoiceService] TTS gate', playing ? 'closed (bot speaking)' : 'open (listening)');
      if (!playing && this.isWaitingForResponse) {
        this.resumeVadAfterResponse();
      }
    });
  }

  private onWsControl(msg: VoiceWsControlMessage): void {
    console.log('[VoiceService] onWsControl', msg);
    switch (msg.event) {
      case 'session_started':
        this.logger.log('[VoiceService] WSS session_started', msg.requestId ?? '');
        break;
      case 'listening':
        this._isAcquisitionBlocked$.next(false);
        break;
      case 'transcript': {
        const text = typeof msg.text === 'string' ? msg.text : '';
        this.voiceTranscriptSubject.next({ text, isFinal: !!msg.isFinal });
        break;
      }
      case 'thinking':
        this._isAcquisitionBlocked$.next(true);
        break;
      case 'speaking':
        this._isAcquisitionBlocked$.next(true);
        break;
      case 'done':
        this._isAcquisitionBlocked$.next(false);
        break;
      case 'error':
        this.logger.log('[VoiceService] WSS error', msg.message ?? msg);
        break;
      default:
        break;
    }
  }

  /** Chunk TTS: ogni buffer deve essere decodificabile da `decodeAudioData` (es. segmento WebM/Opus completo). */
  private async playWsTtsChunk(buf: ArrayBuffer): Promise<void> {
    try {
      if (!this.ttsPlayContext || this.ttsPlayContext.state === 'closed') {
        this.ttsPlayContext = new AudioContext();
        this.ttsNextPlayTime = this.ttsPlayContext.currentTime;
      }
      const ctx = this.ttsPlayContext;
      const audioBuf = await ctx.decodeAudioData(buf.slice(0));
      const src = ctx.createBufferSource();
      src.buffer = audioBuf;
      src.connect(ctx.destination);
      const t0 = Math.max(ctx.currentTime, this.ttsNextPlayTime);
      src.start(t0);
      this.ttsNextPlayTime = t0 + audioBuf.duration;
    } catch (e) {
      this.logger.log('[VoiceService] chunk TTS non decodificabile (formato chunk?)', e);
    }
  }

  async stopSession(options?: { discardInProgressSegment?: boolean}): Promise<{ voiceIngressResultUrl: string | null }> {
    const discard = options?.discardInProgressSegment === true;

    this.wsControlSub?.unsubscribe();
    this.wsControlSub = undefined;
    this.ttsChunkSub?.unsubscribe();
    this.ttsChunkSub = undefined;

    try {
      if (this.ttsPlayContext && this.ttsPlayContext.state !== 'closed') {
        await this.ttsPlayContext.close();
      }
    } catch {
      /* ignore */
    }
    this.ttsPlayContext = undefined;
    this.ttsNextPlayTime = 0;

    let voiceIngressResultUrl: string | null = null;
    if (this.voiceIngressConfig) {
      try {
        const { resultUrl } = await this.voiceStreaming.stop({discard: true, awaitServerResultUrl: true});
        voiceIngressResultUrl = resultUrl ?? null;
      } catch (e) {
        this.logger.log('[VoiceService] stopSession voiceStreaming.stop', e);
      }
      this.voiceIngressConfig = null;
    }

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

    // 🚫 clear acquisition gate
    clearTimeout(this.responseTimeoutId);
    this.responseTimeoutId = undefined;
    this.isWaitingForResponse = false;
    this._isAcquisitionBlocked$.next(false);

    return { voiceIngressResultUrl };
  }

  /**
   * Scarta il segmento WebM in corso (nessun upload/STT) senza chiudere VAD, mic o sessione.
   * Lo stream resta in ascolto per il prossimo `onSpeechStart`.
   */
  discardCurrentRecordingSegment(): void {
    if (!this.vad) {
      return;
    }
    if (this.mediaRecorder) {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.ondataavailable = null;
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
    }
    this.mediaRecorder = undefined;
    this.audioChunks = [];
    this.logger.log('[VoiceService] discarded in-progress segment (legacy VAD)');
  }

  /**
   * 🔄 RESUME VAD AFTER RESPONSE
   * Called when isTTSPlaying$ goes false while isWaitingForResponse is true,
   * or by the safety timeout if no TTS response arrives within 30 s.
   */
  private resumeVadAfterResponse(): void {
    this.isWaitingForResponse = false;
    clearTimeout(this.responseTimeoutId);
    this.responseTimeoutId = undefined;
    this._isAcquisitionBlocked$.next(false);
    if (this.vad) {
      this.vad.start().catch((e) => this.logger.log('[VoiceService] VAD resume error', e));
    }
  }

  /**
   * ⏱️ SAFETY TIMEOUT
   * Forces VAD re-enable after 30 s in case no TTS response ever arrives.
   */
  private setResponseSafetyTimeout(): void {
    clearTimeout(this.responseTimeoutId);
    this.responseTimeoutId = setTimeout(() => {
      this.logger.log('[VoiceService] safety timeout: re-enabling VAD acquisition');
      this.resumeVadAfterResponse();
    }, 30_000);
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

    this.logger.log('[VoiceService] segment ready', payload.transcript ?? payload.transcriptionError ?? payload.blob.size);

    this.audioSegmentSubject.next(payload);

    this.onRecordingComplete?.(payload);
  }

}
