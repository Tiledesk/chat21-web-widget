import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'chat-audio-sync',
  templateUrl: './audio-sync.component.html',
  styleUrl: './audio-sync.component.scss'
})
export class AudioSyncComponent implements AfterViewInit{

  @Input() metadata: any | null = null;
  @Input() text: string | null = null;
  @Input() color?: string;

  @ViewChild('audioPlayer') audioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('transcriptBox') transcriptBox!: ElementRef<HTMLDivElement>;

  words: {
    text: string;
    start: number;
    end: number;
    visible: boolean;
  }[] = [];

  currentTime = 0;
  duration = 1;
  activeIndex = -1;

  ngAfterViewInit(): void {
    const audio = this.audioRef.nativeElement;

    audio.onloadedmetadata = () => {
      this.duration = audio.duration || 1;
      this.generateFakeTiming();

      setTimeout(() => audio.play().catch(() => {}), 200);
    };
  }

  generateFakeTiming() {
    const raw = (this.text || '').split(/\s+/);
    const step = this.duration / raw.length;

    this.words = raw.map((w, i) => ({
      text: w,
      start: i * step,
      end: (i + 1) * step,
      visible: false
    }));
  }

  onTimeUpdate() {
    const audio = this.audioRef.nativeElement;
    this.currentTime = audio.currentTime;

    this.words.forEach((w, i) => {
      // appare quando il tempo è arrivato al suo start
      if (this.currentTime >= w.start) {
        w.visible = true;
      }

      // parola attiva
      if (this.currentTime >= w.start && this.currentTime < w.end) {
        this.activeIndex = i;
      }
    });

    this.scrollToActive();
  }

  scrollToActive() {
    const container = this.transcriptBox?.nativeElement;
    const activeEl = container?.querySelector('.active') as HTMLElement;

    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  isActive(i: number): boolean {
    return i === this.activeIndex;
  }

}
