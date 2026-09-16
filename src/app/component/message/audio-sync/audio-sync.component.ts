import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageModel } from 'src/chat21-core/models/message';
import { TtsAudioPlaybackCoordinator } from 'src/app/providers/tts-audio-playback-coordinator.service';
import { VoiceService } from 'src/app/providers/voice/voice.service';
import { Globals } from 'src/app/utils/globals';

/** HAVE_METADATA: metadati già disponibili (tipico audio servito da cache). */
const HAVE_METADATA = 1;
const BROWSER_TTS_OUTPUT_FORMAT = 'mp3_44100_128';

@Component({
  selector: 'chat-audio-sync',
  templateUrl: './audio-sync.component.html',
  styleUrl: './audio-sync.component.scss',
})
export class AudioSyncComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() message: MessageModel | null = null;
  @Input() color?: string;

  @ViewChild('audioPlayer') audioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('transcriptBox') transcriptBox!: ElementRef<HTMLElement>;

  words: {
    text: string;
    start: number;
    end: number;
    state: 'future' | 'active' | 'past';
  }[] = [];

  currentTime = 0;
  duration = 1;
  activeIndex = -1;

  private timingReady = false;
  private onMetadataLoaded: () => void;
  private onPlaybackEnded: () => void;

  /** Id univoco per il coordinatore (di solito `message.uid`). */
  private playbackOwnerId = '';
  private destroyed = false;
  private playbackRequested = false;
  private playbackStarted = false;
  private streamAbort?: AbortController;
  private mediaSourceObjectUrl?: string;
  private stopAllSub?: Subscription;
  private preemptSub?: Subscription;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly ttsPlayback: TtsAudioPlaybackCoordinator,
    private readonly globals: Globals,
    private readonly voiceService: VoiceService,
  ) {}

  /** `false` = messaggio già in storico: niente autoplay / karaoke. Da `message.isJustRecived`. */
  private get skipSyncAnimation(): boolean {
    return this.message?.isJustRecived === false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['message']) {
      return;
    }
    if (this.audioRef?.nativeElement && this.timingReady) {
      const d = this.audioRef.nativeElement.duration;
      if (Number.isFinite(d) && d > 0) {
        this.duration = d;
      }
      this.buildFakeTiming();
      if (this.skipSyncAnimation) {
        this.markAllWordsPast();
      } else if (this.playbackStarted) {
        this.syncStatesFromCurrentTime();
      }
    }
  }

  ngAfterViewInit(): void {
    const audio = this.audioRef.nativeElement;

    this.playbackOwnerId =
      (this.message?.uid && String(this.message.uid).trim()) ||
      `tts-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    this.onPlaybackEnded = () => {
      this.playbackStarted = false;
      this.cleanupStreaming();
      this.ttsPlayback.releaseIfCurrent(this.playbackOwnerId);
      if (this.skipSyncAnimation) {
        return;
      }
      this.markAllWordsPast();
      if (this.message) {
        this.message.isJustRecived = false;
      }
      this.cdr.detectChanges();
    };

    this.onMetadataLoaded = () => {
      // La durata potrebbe arrivare tardi (specie con streaming).
      const d = audio.duration;
      if (Number.isFinite(d) && d > 0) {
        this.duration = d;
      } else if (!this.timingReady) {
        this.duration = this.estimateDurationSecondsFromText();
      }

      this.timingReady = true;
      this.buildFakeTiming();
      if (this.skipSyncAnimation) {
        this.markAllWordsPast();
        this.cdr.detectChanges();
        return;
      }
      if (this.playbackStarted) {
        this.syncStatesFromCurrentTime();
      }
      this.cdr.detectChanges();
    };

    audio.addEventListener('loadedmetadata', this.onMetadataLoaded);
    audio.addEventListener('ended', this.onPlaybackEnded);

    // Prepara subito le parole (durata stimata) e poi aggiorna quando arriva la metadata reale.
    this.duration = this.estimateDurationSecondsFromText();
    this.timingReady = true;
    this.buildFakeTiming();
    if (this.skipSyncAnimation) {
      this.markAllWordsPast();
      this.cdr.detectChanges();
      return;
    }
    this.cdr.detectChanges();

    setTimeout(() => {
      if (this.playbackRequested || this.destroyed) {
        return;
      }
      this.playbackRequested = true;
      this.ttsPlayback.requestStart(this.playbackOwnerId, () => {
        if (this.destroyed) {
          this.ttsPlayback.releaseIfCurrent(this.playbackOwnerId);
          return;
        }
        this.playbackStarted = true;
        this.syncStatesFromCurrentTime();
        this.cdr.detectChanges();
        this.startPlayback(audio);
      });
    }, 200);

    // Stop signal: user pressed X while this TTS was playing or queued.
    this.stopAllSub = this.ttsPlayback.stopAllPlayback$.subscribe(() => {
      if (!this.playbackRequested && !this.playbackStarted) {
        return;
      }
      this.destroyed = true;
      this.playbackStarted = false;
      this.cleanupStreaming();
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
      this.markAllWordsPast();
      if (this.message) {
        this.message.isJustRecived = false;
      }
      this.cdr.detectChanges();
    });

    // Preempt signal: a newer message requested start while this one was playing.
    // Only react when the emitted id matches this component's own ownerId.
    this.preemptSub = this.ttsPlayback.preemptPlayback$.subscribe((stoppedId) => {
      if (stoppedId !== this.playbackOwnerId) {
        return;
      }
      this.playbackStarted = false;
      this.cleanupStreaming();
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
      this.markAllWordsPast();
      if (this.message) {
        this.message.isJustRecived = false;
      }
      this.cdr.detectChanges();
      // No releaseIfCurrent call — the coordinator already cleared currentOwnerId before emitting.
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.playbackStarted = false;
    this.cleanupStreaming();
    this.stopAllSub?.unsubscribe();
    this.stopAllSub = undefined;
    this.preemptSub?.unsubscribe();
    this.preemptSub = undefined;

    const audio = this.audioRef?.nativeElement;
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
    this.ttsPlayback.release(this.playbackOwnerId);

    if (!audio) {
      return;
    }
    if (this.onMetadataLoaded) {
      audio.removeEventListener('loadedmetadata', this.onMetadataLoaded);
    }
    if (this.onPlaybackEnded) {
      audio.removeEventListener('ended', this.onPlaybackEnded);
    }
  }

  private startPlayback(audio: HTMLAudioElement): void {
    const messageSrc = (this.message as any)?.metadata?.src as string | undefined;

    if (this.message?.type === 'tts') {
      const streamEndpoint = this.voiceService.proxyTtsStreamUrl;
      const fullFileEndpoint = this.voiceService.proxyTtsUrl;
      if (streamEndpoint) {
        this.startStreamingFromEndpoint(audio, streamEndpoint, fullFileEndpoint, messageSrc);
        return;
      }
      if (fullFileEndpoint) {
        this.fetchFullFileFromEndpoint(audio, fullFileEndpoint);
        return;
      }
      if (messageSrc) {
        this.playDirectUrl(audio, messageSrc);
        return;
      }
      this.handlePlaybackError();
      return;
    }

    if (!messageSrc) {
      this.playbackStarted = false;
      this.ttsPlayback.releaseIfCurrent(this.playbackOwnerId);
      this.markAllWordsPast();
      if (this.message) {
        this.message.isJustRecived = false;
      }
      this.cdr.detectChanges();
      return;
    }

    this.playDirectUrl(audio, messageSrc);
  }

  private playDirectUrl(audio: HTMLAudioElement, src: string): void {
    audio.src = src;
    try {
      audio.currentTime = 0;
    } catch {
      /* ignore */
    }
    audio.play().catch(() => this.handlePlaybackError());
  }

  private startStreamingFromEndpoint(
    audio: HTMLAudioElement,
    endpoint: string,
    fullFileEndpoint?: string | null,
    directFallbackSrc?: string,
  ): void {
    this.cleanupStreaming();

    const jwt = this.getJwtToken();
    const voiceSettings = this.getVoiceSettingsBody(); 
    const requestBody = this.buildTtsRequestBody(voiceSettings);
    let fallbackUsed = false;
    const fallback = () => {
      if (fallbackUsed) {
        this.handlePlaybackError();
        return;
      }
      fallbackUsed = true;
      this.cleanupStreaming();
      if (fullFileEndpoint) {
        this.fetchFullFileFromEndpoint(audio, fullFileEndpoint);
        return;
      }
      if (directFallbackSrc) {
        this.playDirectUrl(audio, directFallbackSrc);
        return;
      }
      this.handlePlaybackError();
    };

    // <audio src="..."> non può inviare header/body: serve fetch().
    const hasMse = typeof (window as any).MediaSource !== 'undefined';
    if (!hasMse) {
      fallback();
      return;
    }

    const MediaSourceCtor = (window as any).MediaSource as typeof MediaSource;
    const mediaSource = new MediaSourceCtor();
    const objectUrl = URL.createObjectURL(mediaSource);
    this.mediaSourceObjectUrl = objectUrl;
    audio.src = objectUrl;

    const abort = new AbortController();
    this.streamAbort = abort;

    const onSourceOpen = async () => {
      mediaSource.removeEventListener('sourceopen', onSourceOpen);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `${jwt}`
        };
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: abort.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error(`TTS stream request failed (${response.status})`);
        }

        const headerType = (response.headers.get('content-type') || '').split(';')[0].trim();
        if (headerType && !MediaSourceCtor.isTypeSupported(headerType)) {
          // Fallback: fetch completo e play via blob (no streaming).
          fallback();
          return;
        }

        const mime = headerType || 'audio/mpeg';
        if (!MediaSourceCtor.isTypeSupported(mime)) {
          fallback();
          return;
        }

        const sourceBuffer = mediaSource.addSourceBuffer(mime);
        sourceBuffer.mode = 'sequence';

        const reader = response.body.getReader();
        const queue: Uint8Array[] = [];
        let doneReading = false;
        let started = false;

        const tryEndOfStream = () => {
          if (doneReading && queue.length === 0 && !sourceBuffer.updating) {
            try {
              mediaSource.endOfStream();
            } catch {
              /* ignore */
            }
          }
        };

        const pump = () => {
          if (abort.signal.aborted) {
            return;
          }
          if (sourceBuffer.updating) {
            return;
          }
          const chunk = queue.shift();
          if (!chunk) {
            tryEndOfStream();
            return;
          }
          try {
            const ab = chunk.buffer.slice(
              chunk.byteOffset,
              chunk.byteOffset + chunk.byteLength,
            ) as ArrayBuffer;
            sourceBuffer.appendBuffer(ab);
          } catch {
            fallback();
          }
        };

        sourceBuffer.addEventListener('updateend', () => {
          if (!started && this.playbackStarted && !this.destroyed) {
            started = true;
            audio.play().catch(() => fallback());
          }
          pump();
        });

        // Primo pump (se arrivano subito chunk)
        pump();

        while (!abort.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) {
            doneReading = true;
            break;
          }
          if (value && value.byteLength > 0) {
            queue.push(value);
            pump();
          }
        }

        doneReading = true;
        tryEndOfStream();
      } catch {
        if (!abort.signal.aborted) {
          fallback();
        }
      }
    };

    mediaSource.addEventListener('sourceopen', onSourceOpen);
  }

  private handlePlaybackError(): void {
    this.playbackStarted = false;
    this.cleanupStreaming();
    this.ttsPlayback.releaseIfCurrent(this.playbackOwnerId);
    this.markAllWordsPast();
    if (this.message) {
      this.message.isJustRecived = false;
    }
    this.cdr.detectChanges();
  }

  private cleanupStreaming(): void {
    try {
      this.streamAbort?.abort();
    } catch {
      /* ignore */
    }
    this.streamAbort = undefined;

    if (this.mediaSourceObjectUrl) {
      try {
        URL.revokeObjectURL(this.mediaSourceObjectUrl);
      } catch {
        /* ignore */
      }
      this.mediaSourceObjectUrl = undefined;
    }
  }

  private getJwtToken(): string | null {
    const token = (this.globals?.tiledeskToken || this.globals?.jwt || '').trim();
    return token.length > 0 ? token : null;
  }

  private getVoiceSettingsBody(): unknown {
    const raw = (this.message as any)?.metadata?.voiceSettings;
    if (raw === null || raw === undefined) {
      return {};
    }
    if (typeof raw === 'string') {
      const s = raw.trim();
      if (!s) return {};
      try {
        return JSON.parse(s);
      } catch {
        // se non è JSON valido, invialo come stringa (il backend può gestirlo)
        return { voiceSettings: raw };
      }
    }
    return raw;
  }

  private async fetchAsBlobAndPlay(
    audio: HTMLAudioElement,
    endpoint: string,
    jwt: string | null,
    requestBody: unknown,
  ): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `${jwt}`
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody ?? {}),
        signal: this.streamAbort?.signal,
      });

      if (!response.ok) {
        throw new Error(`TTS request failed (${response.status})`);
      }

      const blob = await response.blob();
      if (this.destroyed) {
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      this.mediaSourceObjectUrl = objectUrl;
      audio.src = objectUrl;
      audio.play().catch(() => this.handlePlaybackError());
    } catch {
      this.handlePlaybackError();
    }
  }

  private fetchFullFileFromEndpoint(audio: HTMLAudioElement, endpoint: string): void {
    const jwt = this.getJwtToken();
    const voiceSettings = this.getVoiceSettingsBody();
    const requestBody = this.buildTtsRequestBody(voiceSettings, false);
    void this.fetchAsBlobAndPlay(audio, endpoint, jwt, requestBody);
  }

  private buildTtsRequestBody(voiceSettings: unknown, streaming = true): unknown {
    const text = this.message?.text ?? '';
    if (
      voiceSettings &&
      typeof voiceSettings === 'object' &&
      !Array.isArray(voiceSettings)
    ) {
      return {
        outputFormat: BROWSER_TTS_OUTPUT_FORMAT,
        ...(voiceSettings as Record<string, unknown>),
        text,
        streaming,
      };
    }
    return {
      voiceSettings,
      text,
      streaming,
      outputFormat: BROWSER_TTS_OUTPUT_FORMAT,
    };
  }

  private markAllWordsPast(): void {
    this.words.forEach((w) => {
      w.state = 'past';
    });
    this.activeIndex = -1;
  }

  private estimateDurationSecondsFromText(): number {
    const rawWords = (this.message?.text || '')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    if (rawWords.length === 0) {
      return 1;
    }
    // ~140 WPM → ~0.43s/word
    return Math.max(1, rawWords.length * 0.43);
  }

  buildFakeTiming(): void {
    const rawWords = (this.message?.text || '')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    if (rawWords.length === 0) {
      this.words = [];
      return;
    }
    const step = this.duration / rawWords.length;

    this.words = rawWords.map((w, i) => ({
      text: w,
      start: i * step,
      end: (i + 1) * step,
      state: 'future' as const,
    }));
  }

  syncStatesFromCurrentTime(): void {
    if (this.skipSyncAnimation) {
      return;
    }
    const audio = this.audioRef?.nativeElement;
    if (!audio || this.words.length === 0) {
      return;
    }
    this.currentTime = audio.currentTime;
    let newActiveIndex = -1;

    this.words.forEach((w, i) => {
      if (this.currentTime >= w.end) {
        w.state = 'past';
      } else if (this.currentTime >= w.start && this.currentTime < w.end) {
        w.state = 'active';
        newActiveIndex = i;
      } else {
        w.state = 'future';
      }
    });

    if (newActiveIndex !== this.activeIndex) {
      this.activeIndex = newActiveIndex;
      this.scrollToActive();
    }
  }

  onTimeUpdate(): void {
    if (!this.playbackStarted) {
      return;
    }
    this.syncStatesFromCurrentTime();
  }

  scrollToActive(): void {
    const container = this.transcriptBox?.nativeElement;
    const active = container?.querySelector('.active') as HTMLElement;

    if (active) {
      active.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  trackByIndex(index: number): number {
    return index;
  }
}
