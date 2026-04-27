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
const PREFERRED_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm'] as const;

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

  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private localChunks: Blob[] = [];
  private currentMimeType = '';
  private stopResolver: (() => void) | null = null;
  /** Stream esterno: non fermare le tracce in `cleanup` (le gestisce il chiamante, es. VoiceService). */
  private streamSharedWithIngress = false;
  private pendingSharedStream?: MediaStream;

  constructor(private readonly appConfig: AppConfigService) {}

  readonly state$: Observable<VoiceStreamingConnectionState> = this._state$.asObservable();
  readonly serverMessage$: Observable<VoiceStreamingServerMessage> = this._serverMessage$.asObservable();
  /** Eventi JSON `msg.event` dal proxy (transcript, listening, speaking, …). */
  readonly wsControl$: Observable<VoiceWsControlMessage> = this._wsControl$.asObservable();
  /** Chunk audio TTS in arrivo (ArrayBuffer) — da decodificare / riprodurre. */
  readonly ttsBinaryChunk$: Observable<ArrayBuffer> = this._ttsBinaryChunk$.asObservable();
  readonly lastError$: Observable<unknown> = this._lastError$.asObservable();

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
    this.streamSharedWithIngress = !!opts?.sharedMediaStream;

    const baseUrl = this.resolveBaseUrl(config.wsBaseUrl);
    const mime = this.resolveMimeType(config.mimeType);
    const timeslice = config.timesliceMs ?? DEFAULT_TIMESLICE_MS;

    const url = this.buildWebSocketUrl(baseUrl, {
      ...config,
      mimeType: mime,
    });
    this.logger.log('[VoiceStreaming] connecting...');

    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url);
      this.ws = socket;
      socket.binaryType = 'arraybuffer';

      const fail = (err: unknown) => {
        this._lastError$.next(err);
        this.setState('error');
        this.logger.log('[VoiceStreaming] start failed', err);
        this.cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      };

      socket.onerror = (ev) => {
        if (this.ws === socket) {
          fail(ev);
        }
      };

      socket.onclose = () => {
        if (this.ws === socket) {
          this.ws = null;
        }
      };

      socket.onmessage = (ev: MessageEvent) => {
        if (ev.data instanceof ArrayBuffer) {
          this._ttsBinaryChunk$.next(ev.data);
          return;
        }
        if (typeof ev.data === 'string') {
          try {
            const msg = JSON.parse(ev.data) as Record<string, unknown>;
            if (typeof msg.event === 'string') {
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
        this.setState('open');
        void this.beginRecordingAfterOpen(socket, mime, timeslice, resolve, fail);
      };
    });
  }

  private async beginRecordingAfterOpen(
    socket: WebSocket,
    mime: string,
    timeslice: number,
    resolve: () => void,
    fail: (e: unknown) => void,
  ): Promise<void> {
    try {
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
        this.logger.log('[VoiceStreaming] MediaRecorder error', ev);
      };

      this.mediaRecorder.start(timeslice);
      this.setState('streaming');
      resolve();
    } catch (e) {
      fail(e);
    }
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
      return;
    }
    void data.arrayBuffer().then((buf) => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(buf);
        } catch (e) {
          this.logger.log('[VoiceStreaming] send chunk error', e);
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
    params.set('token', config.token);
    params.set('projectId', config.projectId);
    if (config.requestId) {
      params.set('requestId', config.requestId);
    }
    if (config.lang) {
      params.set('lang', config.lang);
    }
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
