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
import { MessageModel } from 'src/chat21-core/models/message';

/** HAVE_METADATA: metadati già disponibili (tipico audio servito da cache). */
const HAVE_METADATA = 1;

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

  constructor(private readonly cdr: ChangeDetectorRef) {}

  /** `false` = messaggio già in storico: niente autoplay / karaoke. Da `message.isJustRecived`. */
  private get skipSyncAnimation(): boolean {
    return this.message?.isJustRecived === false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['message']) {
      return;
    }
    if (this.audioRef?.nativeElement && this.timingReady) {
      this.duration = this.audioRef.nativeElement.duration || 1;
      this.buildFakeTiming();
      if (this.skipSyncAnimation) {
        this.markAllWordsPast();
      } else {
        this.syncStatesFromCurrentTime();
      }
    }
  }

  ngAfterViewInit(): void {
    const audio = this.audioRef.nativeElement;

    this.onPlaybackEnded = () => {
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
      if (this.timingReady) {
        return;
      }
      this.timingReady = true;
      this.duration = audio.duration || 1;
      this.buildFakeTiming();
      if (this.skipSyncAnimation) {
        this.markAllWordsPast();
        this.cdr.detectChanges();
        return;
      }
      this.syncStatesFromCurrentTime();
      this.cdr.detectChanges();

      setTimeout(() => {
        audio.play().catch(() => {
          this.syncStatesFromCurrentTime();
          this.cdr.detectChanges();
        });
      }, 200);
    };

    audio.addEventListener('loadedmetadata', this.onMetadataLoaded);
    audio.addEventListener('ended', this.onPlaybackEnded);

    if (audio.readyState >= HAVE_METADATA) {
      this.onMetadataLoaded();
    }
  }

  ngOnDestroy(): void {
    const audio = this.audioRef?.nativeElement;
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

  private markAllWordsPast(): void {
    this.words.forEach((w) => {
      w.state = 'past';
    });
    this.activeIndex = -1;
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
