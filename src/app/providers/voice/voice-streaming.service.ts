import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { AppConfigService } from 'src/app/providers/app-config.service';

import {
  VoiceStreamingConnectionState,
  VoiceStreamingServerMessage,
  VoiceStreamingSessionConfig,
  VoiceStreamingStopOptions,
  VoiceStreamingStopResult,
  VoiceWsControlMessage,
} from './voice-streaming.types';

const DEFAULT_TIMESLICE_MS = 250;
const READY_TIMEOUT_MS = 10_000;
const SESSION_STARTED_TIMEOUT_MS = 10_000;

/** Ordered by preference; covers Chrome (webm), Firefox (ogg), Safari ≥14.1 (mp4). */
const PREFERRED_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/webm',
] as const;

/**
 * Connette al proxy voce (WSS), invia in streaming i chunk `MediaRecorder` (binario) come da contratto.
 * Mantiene anche i chunk locali per costruire un `Blob` completo a fine registrazione (anteprima / invio legacy).
 */
@Injectable({ providedIn: 'root' })
export class VoiceStreamingService {
  private readonly logger: LoggerService = LoggerInstance.getInstance();
  private readonly _state$ = new Subject<VoiceStreamingConnectionState>();
  private readonly _serverMessage$ = new Subject<VoiceStreamingServerMessage>();
  private readonly _wsControl$ = new Subject<VoiceWsControlMessage>();
  private readonly _ttsBinaryChunk$ = new Subject<ArrayBuffer>();
  private readonly _lastError$ = new Subject<unknown>();
  private readonly _closeCode$ = new Subject<number>();

  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private localChunks: Blob[] = [];
  private currentMimeType = '';
  private stopResolver: (() => void) | null = null;
  /** Reject callback for a pending start() promise; called by cleanup() if cancelled mid-connect. */
  private pendingStartFail: ((err: Error) => void) | null = null;
  /** Stream esterno: non fermare le tracce in `cleanup` (le gestisce il chiamante, es. VoiceService). */
  private streamSharedWithIngress = false;
  private pendingSharedStream?: MediaStream;
  private pendingConfig?: VoiceStreamingSessionConfig;
  /** Session ID assigned by the proxy (from session_started payload). Used for log correlation. */
  private currentSessionId: string | undefined;
  /** Audio chunk counter — reset on each new session. */
  private audioChunkCount = 0;
  /** Total bytes sent — reset on each new session. */
  private totalAudioBytesSent = 0;

  constructor(private readonly appConfig: AppConfigService) {}

  readonly state$: Observable<VoiceStreamingConnectionState> = this._state$.asObservable();
  readonly serverMessage$: Observable<VoiceStreamingServerMessage> = this._serverMessage$.asObservable();
  /** Eventi JSON `msg.event` dal proxy (transcript, listening, speaking, …). */
  readonly wsControl$: Observable<VoiceWsControlMessage> = this._wsControl$.asObservable();
  /** Chunk audio TTS in arrivo (ArrayBuffer) — da decodificare / riprodurre. */
  readonly ttsBinaryChunk$: Observable<ArrayBuffer> = this._ttsBinaryChunk$.asObservable();
  readonly lastError$: Observable<unknown> = this._lastError$.asObservable();
  /** Emette il close code WebSocket a ogni disconnessione (4401 = auth, 4400 = config, 1001 = server down, 1006 = network). */
  readonly closeCode$: Observable<number> = this._closeCode$.asObservable();

  get connectionState(): VoiceStreamingConnectionState {
    return this._currentState;
  }

  private _currentState: VoiceStreamingConnectionState = 'idle';
  private setState(s: VoiceStreamingConnectionState): void {
    this._currentState = s;
    this._state$.next(s);
  }

  /**
   * Apre la WSS, poi `MediaRecorder.start(timeslice)` e invia ogni chunk al socket.
   * Con `sharedMediaStream` riusa lo stesso `MediaStream` del chiamante (es. VAD) senza seconda richiesta al mic.
   */
  async start(
    config: VoiceStreamingSessionConfig,
    opts?: { sharedMediaStream?: MediaStream },
  ): Promise<void> {
    await this.stop({ discard: true });
    this.setState('connecting');
    this.localChunks = [];
    this.currentMimeType = '';
    this.pendingSharedStream = opts?.sharedMediaStream;
    this.pendingConfig = config;
    this.streamSharedWithIngress = !!opts?.sharedMediaStream;

    const baseUrl = this.resolveBaseUrl(config.wsBaseUrl);
    const mime = this.resolveMimeType(config.mimeType);
    const timeslice = config.timesliceMs ?? DEFAULT_TIMESLICE_MS;

    const url = this.buildWebSocketUrl(baseUrl, {
      ...config,
      mimeType: mime,
    });
    this.logger.info('[VoiceStreaming] connecting', { url: this.redactQuery(url), mime: mime || '(auto)', timeslice });

    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url);
      this.ws = socket;
      socket.binaryType = 'arraybuffer';
      let startSettled = false;

      const fail = (err: unknown) => {
        if (startSettled) return;
        startSettled = true;
        this.pendingStartFail = null;
        this._lastError$.next(err);
        this.setState('error');
        this.logger.error('[VoiceStreaming] start failed', err);
        this.cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      };

      const succeed = () => {
        if (startSettled) return;
        startSettled = true;
        this.pendingStartFail = null;
        resolve();
      };

      this.pendingStartFail = (err: Error) => fail(err);

      socket.onerror = (ev) => {
        if (this.ws === socket) {
          this.logger.warn('[VoiceStreaming] socket error', ev);
          fail(ev);
        }
      };

      socket.onclose = (ev: CloseEvent) => {
        if (this.ws === socket) {
          this.logger.info('[VoiceStreaming] socket closed', { code: ev.code, reason: ev.reason || '(none)' });
          this.ws = null;
          this._closeCode$.next(ev.code);
          if (this._currentState === 'streaming') {
            // Socket closed while already streaming — stop the recorder and clean up.
            this.cleanup();
            this.setState('closed');
          } else {
            // Socket closed before streaming started (connecting/open state) — reject start().
            const msg = ev.code === 4401 ? 'auth_failed'
                      : ev.code === 4400 ? 'config_error'
                      : `socket closed before streaming (code ${ev.code})`;
            fail(new Error(msg));
          }
        }
      };

      socket.onmessage = (ev: MessageEvent) => {
        if (ev.data instanceof ArrayBuffer) {
          this.logger.debug('[VoiceStreaming] TTS binary chunk received', ev.data.byteLength, 'bytes');
          this._ttsBinaryChunk$.next(ev.data);
          return;
        }
        if (typeof ev.data === 'string') {
          try {
            const msg = JSON.parse(ev.data) as Record<string, unknown>;
            if (typeof msg.event === 'string') {
              this.logger.info('[VoiceStreaming] ←', msg.event);
              if (msg.event === 'session_started' && typeof msg.sessionId === 'string') {
                this.currentSessionId = msg.sessionId;
                this.logger.info('[VoiceStreaming] proxy session ID:', this.currentSessionId);
              }
              this._wsControl$.next(msg as VoiceWsControlMessage);
            }
          } catch {
            /* non JSON */
          }
          this._serverMessage$.next({ data: ev.data, isBinary: false });
        }
      };

      socket.onopen = () => {
        if (this.ws !== socket) {
          return;
        }
        this.logger.info('[VoiceStreaming] socket open');
        this.setState('open');
        const cfg = this.pendingConfig!;
        this.pendingConfig = undefined;
        void this.beginRecordingAfterOpen(socket, cfg, mime, timeslice, succeed, fail);
      };
    });
  }

  private async beginRecordingAfterOpen(
    socket: WebSocket,
    config: VoiceStreamingSessionConfig,
    mime: string,
    timeslice: number,
    resolve: () => void,
    fail: (e: unknown) => void,
  ): Promise<void> {
    try {
      // 1. Wait for the proxy's "ready" signal before sending anything.
      //    The proxy emits this once all server-side handlers are registered.
      this.logger.info('[VoiceStreaming] step 1/5: waiting for proxy ready signal');
      await this.waitForReady(socket);

      // 2. Register the session_started waiter BEFORE sending (defensive ordering).
      const sessionReady = this.waitForSessionStarted(socket);

      // 3. Send config frame (spec §3) — must be sent after "ready", before audio.
      this.logger.info('[VoiceStreaming] step 2/5: sending config frame', {
        sender: config.sender,
        recipient: config.recipient,
        lang: config.lang ?? 'en',
      });
      socket.send(JSON.stringify({
        sender:            config.sender,
        recipient:         config.recipient,
        lang:              config.lang ?? 'en',
        text:              config.text ?? '',
        type:              config.type ?? 'text',
        recipient_fullname: config.recipient_fullname ?? '',
        sender_fullname:   config.sender_fullname ?? '',
        attributes:        config.attributes ?? {},
        metadata:          config.metadata ?? '',
        channel_type:      config.channel_type ?? '',
      }));

      // 4. Wait for session_started before opening the mic/recorder.
      this.logger.info('[VoiceStreaming] step 3/5: waiting for session_started');
      await sessionReady;
      this.logger.info('[VoiceStreaming] step 4/5: session ready – opening microphone');

      const shared = this.pendingSharedStream;
      this.pendingSharedStream = undefined;
      this.mediaStream = shared
        ? shared
        : await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorderOpts: MediaRecorderOptions = {};
      if (mime) {
        recorderOpts.mimeType = mime;
      }
      this.mediaRecorder = new MediaRecorder(this.mediaStream, recorderOpts);
      this.currentMimeType = this.mediaRecorder.mimeType || mime || 'audio/webm';

      this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          this.localChunks.push(e.data);
          this.sendChunkIfOpen(socket, e.data);
        }
      };

      this.mediaRecorder.onerror = (ev) => {
        this.logger.error('[VoiceStreaming] MediaRecorder error', ev);
      };

      this.mediaRecorder.start(timeslice);
      this.logger.info('[VoiceStreaming] step 5/5: recorder started', {
        mimeType: this.currentMimeType,
        timeslice,
      });
      this.setState('streaming');
      resolve();
    } catch (e) {
      this.logger.error('[VoiceStreaming] beginRecordingAfterOpen failed', e);
      fail(e);
    }
  }

  /** Resolves when the proxy sends `ready`; rejects on socket close or timeout. */
  private waitForReady(socket: WebSocket): Promise<void> {
    this.logger.info('[VoiceStreaming] waiting for ready...');
    return new Promise<void>((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          this.logger.warn('[VoiceStreaming] ready timeout after', READY_TIMEOUT_MS, 'ms');
          reject(new Error('[VoiceStreaming] ready timeout'));
        }
      }, READY_TIMEOUT_MS);

      const onMessage = (ev: MessageEvent) => {
        if (settled || typeof ev.data !== 'string') return;
        try {
          const msg = JSON.parse(ev.data) as Record<string, unknown>;
          if (msg.event === 'ready') {
            settled = true;
            cleanup();
            this.logger.info('[VoiceStreaming] ready received');
            resolve();
          } else if (msg.event === 'error') {
            settled = true;
            cleanup();
            this.logger.warn('[VoiceStreaming] proxy error before ready:', msg.message ?? msg.code ?? 'unknown');
            reject(new Error(`[VoiceStreaming] proxy error before ready: ${msg.message ?? msg.code ?? 'unknown'}`));
          }
        } catch { /* non-JSON */ }
      };

      const onClose = (ev: CloseEvent) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(`[VoiceStreaming] socket closed before ready (code ${ev.code})`));
      };

      const cleanup = () => {
        clearTimeout(timer);
        socket.removeEventListener('message', onMessage);
        socket.removeEventListener('close', onClose);
      };

      socket.addEventListener('message', onMessage);
      socket.addEventListener('close', onClose);
    });
  }

  /** Resolves when the proxy sends `session_started`; rejects on socket close or timeout. */
  private waitForSessionStarted(socket: WebSocket): Promise<void> {
    this.logger.info('[VoiceStreaming] waiting for session_started...');
    return new Promise<void>((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          this.logger.warn('[VoiceStreaming] session_started timeout after', SESSION_STARTED_TIMEOUT_MS, 'ms');
          reject(new Error('[VoiceStreaming] session_started timeout'));
        }
      }, SESSION_STARTED_TIMEOUT_MS);

      const onMessage = (ev: MessageEvent) => {
        if (settled || typeof ev.data !== 'string') return;
        try {
          const msg = JSON.parse(ev.data) as Record<string, unknown>;
          if (msg.event === 'session_started') {
            settled = true;
            cleanup();
            this.logger.info('[VoiceStreaming] session_started received');
            resolve();
          } else if (msg.event === 'error') {
            settled = true;
            cleanup();
            this.logger.warn('[VoiceStreaming] proxy error before session_started:', msg.message ?? msg.code ?? 'unknown');
            reject(new Error(`[VoiceStreaming] proxy error before session_started: ${msg.message ?? msg.code ?? 'unknown'}`));
          }
        } catch { /* non-JSON */ }
      };

      const onClose = (ev: CloseEvent) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(`[VoiceStreaming] socket closed before session_started (code ${ev.code})`));
      };

      const cleanup = () => {
        clearTimeout(timer);
        socket.removeEventListener('message', onMessage);
        socket.removeEventListener('close', onClose);
      };

      socket.addEventListener('message', onMessage);
      socket.addEventListener('close', onClose);
    });
  }

  /**
   * Ferma recorder e, se richiesto, attende l’URL dal server prima di chiudere la WSS.
   */
  stop(options?: VoiceStreamingStopOptions): Promise<VoiceStreamingStopResult> {
    const discard = options?.discard === true;
    const awaitUrl = options?.awaitServerResultUrl === true;
    const urlTimeout = options?.serverResultTimeoutMs ?? 0;// 30_000;
    if (!this.ws && !this.mediaRecorder && !this.mediaStream) {
      this.setState('idle');
      return Promise.resolve({ blob: null, mimeType: '', resultUrl: null });
    }
    this.logger.info('[VoiceStreaming] stop', {
      chunks: this.audioChunkCount,
      totalBytes: this.totalAudioBytesSent,
      discard,
      sessionId: this.currentSessionId,
    });
    this.setState('stopping');
    return new Promise((resolve) => {
      const finalize = (resultUrl: string | null) => {
        this.stopResolver = null;
        if (discard) {
          this.localChunks = [];
        }
        const mime = this.currentMimeType || 'audio/webm';
        const blob =
          !discard && this.localChunks.length > 0
            ? new Blob(this.localChunks, { type: mime })
            : null;
        this.localChunks = [];
        this.cleanup();
        this.setState('closed');
        resolve({ blob, mimeType: blob?.type || mime, resultUrl });
      };

      this.stopResolver = () => {
        const ws = this.ws;
        if (awaitUrl && ws && ws.readyState === WebSocket.OPEN) {
          void this.waitForResultUrl(ws, urlTimeout).then((url) => finalize(url));
        } else {
          finalize(null);
        }
      };

      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.onstop = () => {
          if (this.stopResolver) {
            this.stopResolver();
          }
        };
        this.mediaRecorder.stop();
      } else {
        if (this.stopResolver) {
          this.stopResolver();
        }
      }
    });
  }

  /**
   * Dopo la chiusura recorder: URL in JSON, oppure messaggio `{ event: 'done' }` (restituisce url se presente, altrimenti null).
   */
  private waitForResultUrl(ws: WebSocket, timeoutMs: number): Promise<string | null> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (url: string | null) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        ws.removeEventListener('message', onMessage);
        resolve(url);
      };
      const onMessage = (ev: MessageEvent) => {
        if (typeof ev.data !== 'string') {
          return;
        }
        try {
          const o = JSON.parse(ev.data) as Record<string, unknown>;
          if (o.event === 'done') {
            finish(this.parseResultUrlFromPayload(ev.data));
            return;
          }
        } catch {
          /* non JSON */
        }
        const url = this.parseResultUrlFromPayload(ev.data);
        if (url) {
          finish(url);
        }
      };
      const timer = setTimeout(() => finish(null), timeoutMs);
      ws.addEventListener('message', onMessage);
    });
  }

  private parseResultUrlFromPayload(data: string): string | null {
    const t = data.trim();
    if (!t) {
      return null;
    }
    try {
      const o = JSON.parse(t) as Record<string, unknown>;
      if (o.event === 'done') {
        const u = o.url ?? o.audioUrl ?? o.fileUrl ?? o.resultUrl ?? o.href;
        if (typeof u === 'string' && u.length > 0) {
          return u;
        }
      }
      const u = o.url ?? o.audioUrl ?? o.fileUrl ?? o.resultUrl ?? o.href;
      if (typeof u === 'string' && u.length > 0) {
        return u;
      }
    } catch {
      /* not JSON */
    }
    if (/^https?:\/\//i.test(t)) {
      return t;
    }
    return null;
  }

  isActive(): boolean {
    return (
      this.mediaRecorder?.state === 'recording' ||
      this._currentState === 'connecting' ||
      this._currentState === 'open' ||
      this._currentState === 'streaming'
    );
  }

  private cleanup(): void {
    this.logger.info('[VoiceStreaming] cleanup', { state: this._currentState, sessionId: this.currentSessionId });
    this.audioChunkCount = 0;
    this.totalAudioBytesSent = 0;
    this.currentSessionId = undefined;
    // If cleanup() is called externally while start() is still pending (e.g. stop() during
    // a mid-connect state), reject the stranded start() promise so the caller isn't hung.
    if (this.pendingStartFail) {
      const f = this.pendingStartFail;
      this.pendingStartFail = null;
      f(new Error('start cancelled'));
    }
    if (this.mediaStream) {
      if (!this.streamSharedWithIngress) {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      }
      this.mediaStream = null;
    }
    this.streamSharedWithIngress = false;
    this.mediaRecorder = null;
    if (this.ws) {
      const s = this.ws;
      this.ws = null;
      s.onopen = null;
      s.onmessage = null;
      s.onerror = null;
      s.onclose = null;
      if (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING) {
        s.close();
      }
    }
  }

  private sendChunkIfOpen(socket: WebSocket, data: Blob): void {
    if (socket.readyState !== WebSocket.OPEN) {
      this.logger.warn('[VoiceStreaming] sendChunk skipped – socket not open', { readyState: socket.readyState });
      return;
    }
    void data.arrayBuffer().then((buf) => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(buf);
          this.audioChunkCount++;
          this.totalAudioBytesSent += buf.byteLength;
          if (this.audioChunkCount === 1) {
            this.logger.info('[VoiceStreaming] first audio chunk sent', { bytes: buf.byteLength, sessionId: this.currentSessionId });
          } else if (this.audioChunkCount % 40 === 0) {
            this.logger.debug('[VoiceStreaming] audio streaming', { chunks: this.audioChunkCount, totalBytes: this.totalAudioBytesSent });
          }
        } catch (e) {
          this.logger.error('[VoiceStreaming] send chunk error', e);
        }
      }
    });
  }

  private resolveBaseUrl(override?: string): string {
    const fromApp = String(this.appConfig.getConfig()?.voiceProxyWsBaseUrl ?? '').trim();
    const raw = (String(override ?? '').trim() || fromApp).trim();
    if (!raw) {
      throw new Error(
        'Voice stream: nessun ws base URL. Imposta `wsBaseUrl` nel config, `voiceProxyWsBaseUrl` in AppConfig, o in widget config.',
      );
    }
    return this.normalizeWsBase(raw);
  }

  private normalizeWsBase(u: string): string {
    let s = u.trim();
    if (s.startsWith('http://')) {
      s = 'ws://' + s.slice('http://'.length);
    } else if (s.startsWith('https://')) {
      s = 'wss://' + s.slice('https://'.length);
    }
    return s.replace(/\/$/, '');
  }

  private buildWebSocketUrl(base: string, config: VoiceStreamingSessionConfig & { mimeType: string }): string {
    const params = new URLSearchParams();
    params.set('token', config.token.replace(/^JWT\s+/i, ''));
    if (config.sttProvider) {
      params.set('sttProvider', config.sttProvider);
    }
    if (config.ttsProvider) {
      params.set('ttsProvider', config.ttsProvider);
    }
    if (config.mimeType) {
      params.set('mimeType', config.mimeType);
    }
    const q = params.toString();
    return q ? `${base}?${q}` : base;
  }

  private redactQuery(url: string): string {
    return url.replace(/([?&]token=)[^&]*/g, '$1<redacted>');
  }

  private resolveMimeType(override?: string): string {
    if (override && override.trim() !== '') {
      return override.trim();
    }
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      for (const c of PREFERRED_MIME_CANDIDATES) {
        if (MediaRecorder.isTypeSupported(c)) {
          return c;
        }
      }
    }
    return '';
  }
}
