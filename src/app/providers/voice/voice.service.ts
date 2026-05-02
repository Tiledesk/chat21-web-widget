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

  /** Testo TTS in riproduzione, emesso dall'evento WSS `speaking` (proxy). */
  private readonly voiceTtsTextSubject = new Subject<string>();
  /** Emette il testo del bot che sta per essere riprodotto come audio TTS. */
  readonly voiceTtsText$: Observable<string> = this.voiceTtsTextSubject.asObservable();

  /** Errore applicativo dal proxy (evento `error`): testo descrittivo del problema. */
  private readonly _wsError$ = new Subject<string>();
  readonly wsError$: Observable<string> = this._wsError$.asObservable();

  private readonly volumeSubject = new BehaviorSubject<number>(0);
  readonly volume$: Observable<number> = this.volumeSubject.asObservable();

  /**
   * Emits `true` while a WSS voice-proxy session is active.
   * Used to suppress the tiledesk-server TTS playback path (audio-sync component)
   * when the speech-proxy is already handling TTS over the WebSocket binary channel.
   */
  private readonly _isWssVoiceActive$ = new BehaviorSubject<boolean>(false);
  readonly isWssVoiceActive$: Observable<boolean> = this._isWssVoiceActive$.asObservable();
  get isWssVoiceActive(): boolean { return this._isWssVoiceActive$.getValue(); }

  /**
   * UIDs of TTS messages that were played by the speech-proxy during an active voice session.
   * These messages must never be replayed by audio-sync after the session ends.
   */
  private readonly _proxyHandledTtsIds = new Set<string>();

  /** Register a TTS message UID as having been played by the proxy. */
  markProxyHandled(uid: string): void {
    if (uid) { this._proxyHandledTtsIds.add(uid); }
  }

  /** Returns true if the message was already played by the proxy and should not be replayed. */
  wasProxyHandled(uid: string | undefined): boolean {
    return !!uid && this._proxyHandledTtsIds.has(uid);
  }

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

  // Tracks how many TTS audio sources are still decoding or playing.
  // Incremented synchronously when a binary chunk arrives (before decodeAudioData).
  // Decremented in src.onended (or on decode error).
  private _activeTtsSources = 0;
  // References to active AudioBufferSourceNodes so they can be stopped on preemption.
  private _activeTtsSourceNodes: AudioBufferSourceNode[] = [];
  // Set to true by the 'done' event; triggers acquisition unblock once all sources end.
  private _unblockAfterTts = false;
  private _unblockSafetyTimer: ReturnType<typeof setTimeout> | null = null;

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
      // Subscribe before start() so early events (e.g. proxy 'error') are not lost.
      this.wsControlSub = this.voiceStreaming.wsControl$.subscribe((msg) => this.onWsControl(msg));
      this.ttsChunkSub = this.voiceStreaming.ttsBinaryChunk$.subscribe((buf) => void this.playWsTtsChunk(buf));
      await this.voiceStreaming.start(this.voiceIngressConfig!, { sharedMediaStream: this.stream });
      // Signal that the voice proxy is now live — suppresses tiledesk-server TTS.
      this._isWssVoiceActive$.next(true);
      this.logger.log('[VoiceService] sessione WSS (nessun VAD locale)');
    } catch (e) {
      this.wsControlSub?.unsubscribe();
      this.wsControlSub = undefined;
      this.ttsChunkSub?.unsubscribe();
      this.ttsChunkSub = undefined;
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
    this.logger.log('[VoiceService] ← ws-control', msg.event, msg);
    switch (msg.event) {
      case 'session_started':
        this.logger.log('[VoiceService] session_started', { requestId: msg.requestId ?? '' });
        break;
      case 'listening':
        // Proxy confirmed it is in LISTENING state — unblock the UI.
        // Audio has been flowing continuously (AEC handles echo suppression),
        // so there is nothing to unmute here.
        this._isAcquisitionBlocked$.next(false);
        this.logger.log('[VoiceService] listening – acquisition unblocked');
        break;
      case 'transcript': {
        const text = typeof msg.text === 'string' ? msg.text : '';
        const isFinal = !!msg.isFinal;
        this.logger.log('[VoiceService] transcript', { text, isFinal });
        this.voiceTranscriptSubject.next({ text, isFinal });
        break;
      }
      case 'thinking':
        // Block acquisition UI while the bot processes the utterance.
        // Audio continues flowing to the proxy so the server can detect
        // barge-in via Flux STT even during PROCESSING state.
        this._isAcquisitionBlocked$.next(true);
        this.logger.log('[VoiceService] thinking – acquisition blocked', { activeTtsSources: this._activeTtsSources });
        break;
      case 'speaking': {
        this._isAcquisitionBlocked$.next(true);
        // Do NOT mute the microphone. The MediaStream is captured with
        // echoCancellation: true, so the browser's AEC filters out the bot's
        // speaker output before it reaches the MediaRecorder. Audio keeps
        // flowing to the proxy so Flux can fire StartOfTurn when the user
        // speaks, enabling server-side barge-in detection.
        this._cancelAllTtsAudio();
        // Reset TTS scheduling so new chunks play from now, not a stale future time.
        this.ttsNextPlayTime = this.ttsPlayContext?.currentTime ?? 0;
        const preview = typeof msg.text === 'string' ? msg.text.slice(0, 80) : '';
        this.logger.log('[VoiceService] speaking – acquisition blocked, TTS text preview', { preview });
        // Emit the text being spoken so UI can display it alongside the audio.
        if (typeof msg.text === 'string' && msg.text) {
          this.voiceTtsTextSubject.next(msg.text);
        }
        break;
      }
      case 'done':
        // Do not unblock immediately — the audio binary may still be decoding/playing.
        // _activeTtsSources tracks pending sources; when the last one ends, acquisition unblocks.
        if (this._activeTtsSources > 0) {
          this._unblockAfterTts = true;
          // Safety: force-unblock after 15 s in case onended never fires.
          if (this._unblockSafetyTimer !== null) clearTimeout(this._unblockSafetyTimer);
          this._unblockSafetyTimer = setTimeout(() => this._flushTtsUnblock(true), 15000);
          this.logger.log('[VoiceService] done – TTS still pending, waiting for all sources to end', { activeTtsSources: this._activeTtsSources });
        } else {
          // No audio sources pending — playback was already complete (or audio was empty).
          // Signal the proxy synchronously; mic stays muted until the proxy confirms
          // LISTENING via the 'listening' event.
          this.logger.log('[VoiceService] done – no pending TTS, sending playback complete immediately');
          this.voiceStreaming.sendPlaybackComplete();
          // Do NOT unblock acquisition here — proxy will send 'listening' which is
          // the single source of truth for unblocking both UI and mic.
        }
        break;
      case 'barge_in':
        // Proxy's VAD detected user speech while the bot was talking — stop TTS immediately.
        // Do NOT send tts_playback_complete; this is an interruption, not a normal completion.
        // The proxy will follow with { event: "listening" } which authoritatively unblocks the UI.
        // Audio was never muted, so there is nothing to unmute.
        this._cancelAllTtsAudio();
        this.ttsNextPlayTime = 0;
        this._unblockAfterTts = false;
        this._isAcquisitionBlocked$.next(false);
        this.logger.log('[VoiceService] barge_in – TTS cancelled, acquisition unblocked');
        break;
      case 'error': {
        const errorMsg = typeof msg.message === 'string' ? msg.message : 'Voice session error';
        this.logger.error('[VoiceService] WSS error', errorMsg);
        this._wsError$.next(errorMsg);
        break;
      }
      default:
        this.logger.warn('[VoiceService] unhandled ws-control event', msg.event);
        break;
    }
  }

  /** Chunk TTS: ogni buffer deve essere decodificabile da `decodeAudioData` (es. segmento WebM/Opus completo). */
  private async playWsTtsChunk(buf: ArrayBuffer): Promise<void> {
    // Increment SYNCHRONOUSLY before any await so the 'done' event handler (which arrives
    // on the next WebSocket message — a different event-loop tick) sees a non-zero count.
    this._activeTtsSources++;
    this.logger.log('[VoiceService] TTS chunk received', { bytes: buf.byteLength, activeTtsSources: this._activeTtsSources });
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
      this._activeTtsSourceNodes.push(src);
      this.logger.log('[VoiceService] TTS chunk scheduled', { durationS: audioBuf.duration.toFixed(3), startsAtS: t0.toFixed(3), activeTtsSources: this._activeTtsSources });
      src.onended = () => this._onTtsSourceEnded(src);
    } catch (e) {
      this._onTtsSourceEnded();
      this.logger.warn('[VoiceService] TTS chunk decode failed', e);
    }
  }

  private _onTtsSourceEnded(src?: AudioBufferSourceNode): void {
    this._activeTtsSources = Math.max(0, this._activeTtsSources - 1);
    if (src) {
      const idx = this._activeTtsSourceNodes.indexOf(src);
      if (idx !== -1) { this._activeTtsSourceNodes.splice(idx, 1); }
    }
    this.logger.log('[VoiceService] TTS source ended', { activeTtsSources: this._activeTtsSources, unblockPending: this._unblockAfterTts });
    if (this._unblockAfterTts && this._activeTtsSources === 0) {
      this._flushTtsUnblock(false);
    }
  }

  /**
   * Immediately stops all currently playing/scheduled TTS audio sources.
   * Called when a new `speaking` event arrives (new bot turn) to prevent overlap with
   * the previous turn's audio, and during `stopSession`.
   * Clears `onended` callbacks BEFORE stopping so that `_onTtsSourceEnded` is NOT
   * invoked for cancelled nodes (avoiding spurious `sendPlaybackComplete` calls).
   */
  private _cancelAllTtsAudio(): void {
    if (this._unblockSafetyTimer !== null) {
      clearTimeout(this._unblockSafetyTimer);
      this._unblockSafetyTimer = null;
    }
    for (const src of this._activeTtsSourceNodes) {
      src.onended = null;
      try { src.stop(); } catch { /* already ended — ignore */ }
    }
    this._activeTtsSourceNodes = [];
    this._activeTtsSources = 0;
    this._unblockAfterTts = false;
    this.logger.log('[VoiceService] TTS cancelled – all audio sources stopped');
  }

  private _flushTtsUnblock(fromSafetyTimer = false): void {
    this._unblockAfterTts = false;
    this._activeTtsSources = 0;
    if (this._unblockSafetyTimer !== null) {
      clearTimeout(this._unblockSafetyTimer);
      this._unblockSafetyTimer = null;
    }
    if (fromSafetyTimer) {
      this.logger.warn('[VoiceService] TTS unblock: safety timer fired – forcing playback complete');
    } else {
      this.logger.log('[VoiceService] TTS unblock: all sources ended, sending playback complete');
    }
    // Signal the proxy that TTS playback is complete.  The proxy will transition
    // to LISTENING and send a 'listening' event back; the mic is unmuted there
    // (not here) so it is live only when the proxy is confirmed ready.
    // Do NOT call _isAcquisitionBlocked$.next(false) here — 'listening' is the
    // single source of truth so that UI and mic unblock atomically.
    this.voiceStreaming.sendPlaybackComplete();
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
    this._cancelAllTtsAudio();
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
      this._isWssVoiceActive$.next(false);
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
