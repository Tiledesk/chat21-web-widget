import { Component, Input, OnChanges, OnDestroy, OnInit, Optional, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { VoiceService } from 'src/app/providers/voice/voice.service';

export type StreamAudioSpectrumMode = 'alert' | 'button';

/**
 * Icona stream: cerchio con linea orizzontale tipo spettro, reattiva al volume del microfono.
 * Il parent (es. conversation-footer) aggiorna solo {@link volume} da VoiceService.
 */
@Component({
  selector: 'chat-stream-audio-spectrum',
  templateUrl: './stream-audio-spectrum.component.html',
  styleUrl: './stream-audio-spectrum.component.scss',
})
export class StreamAudioSpectrumComponent implements OnInit, OnChanges {
  private static gradSeq = 0;
  readonly gradientId = `streamSpectrumGrad-${++StreamAudioSpectrumComponent.gradSeq}`;

  /** Volume normalizzato come emesso da VoiceService (stessa scala del footer). */
  @Input() volume = 0;
  /** Colore tema (stroke / gradient); opzionale. */
  @Input() accentColor?: string;

  /** UI variant. `alert` = spectrum line (in #streamAudioAlert). `button` = icon / pill with bars + label. */
  @Input() mode: StreamAudioSpectrumMode = 'alert';
  /** For `mode="button"`: whether the stream is active (expanded pill). */
  @Input() active = false;
  /** For `mode="button"`: VAD speech flag; if omitted, we fall back to a volume threshold heuristic. */
  @Input() isUserSpeaking?: boolean;
  /** For `mode="button"`: label on the pill. */
  @Input() translationMap: Map< string, string>;

  // ALERT (spectrum line)
  spectrumLinePath = 'M0,16 L100,16';

  // BUTTON (bars)
  barScales: [number, number, number, number] = [0.65, 0.65, 0.65, 0.65];
  private rafId: number | null = null;
  private lastSpeaking = false;
  private voiceSpeechStartSub?: Subscription;
  private voiceSpeechEndSub?: Subscription;
  private internalIsUserSpeaking = false;

  constructor(@Optional() private readonly voiceService: VoiceService | null) {}

  ngOnInit(): void {
    // Optional: use VAD speech events to improve idle/speaking detection.
    if (this.voiceService) {
      this.voiceSpeechStartSub = this.voiceService.speechStart$?.subscribe(() => {
        this.internalIsUserSpeaking = true;
      });
      this.voiceSpeechEndSub = this.voiceService.speechEnd$?.subscribe(() => {
        this.internalIsUserSpeaking = false;
      });
    }
    this.refreshAll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['volume'] || changes['mode'] || changes['active'] || changes['isUserSpeaking']) {
      this.refreshAll();
    }
  }

  ngOnDestroy(): void {
    this.stopRaf();
    this.voiceSpeechStartSub?.unsubscribe();
    this.voiceSpeechEndSub?.unsubscribe();
  }

  private refreshAll(): void {
    if (this.mode === 'alert') {
      this.refreshSpectrumPath();
      this.stopRaf();
      return;
    }
    this.refreshBars();
  }

  private refreshSpectrumPath(): void {
    const intensity = Math.min(this.volume / 80, 1);
    const t = Date.now() / 175;
    this.spectrumLinePath = this.buildSpectrumLinePath(intensity, t);
  }

  private buildSpectrumLinePath(intensity: number, t: number): string {
    const x0 = 0;
    const x1 = 100;
    const cy = 16;
    const segments = 100;
    const amp = 0.8 + intensity * 6.5;
    const parts: string[] = [];
    for (let i = 0; i <= segments; i++) {
      const p = i / segments;
      const x = x0 + p * (x1 - x0);
      const u = p * Math.PI * 6;
      const wobble =
        Math.sin(u + t) * 0.34 +
        Math.sin(u * 2.35 + t * 1.12) * 0.24 +
        Math.sin(u * 4.2 + t * 0.72) * 0.18 +
        Math.sin(u * 6.8 + t * 1.05) * 0.14 +
        Math.sin(u * 9.1 + t * 0.88) * 0.1;
      const y = cy + amp * wobble;
      const yClamped = Math.min(30, Math.max(2, y));
      parts.push(i === 0 ? `M${x.toFixed(2)},${yClamped.toFixed(2)}` : `L${x.toFixed(2)},${yClamped.toFixed(2)}`);
    }
    return parts.join('');
  }

  private refreshBars(): void {
    if (!this.active) {
      this.stopRaf();
      return;
    }

    const speaking = this.computeSpeaking();
    if (!speaking) {
      this.stopRaf();
      this.barScales = [0.65, 0.65, 0.65, 0.65];
      this.lastSpeaking = false;
      return;
    }

    // speaking: animate bars with volume-driven intensity
    if (!this.lastSpeaking) {
      this.lastSpeaking = true;
    }
    this.startRaf();
  }

  private computeSpeaking(): boolean {
    if (typeof this.isUserSpeaking === 'boolean') {
      return this.isUserSpeaking;
    }
    if (this.voiceService) {
      return this.internalIsUserSpeaking;
    }
    // Fallback heuristic: treat as speaking when volume crosses a low threshold.
    return (this.volume || 0) >= 4;
  }

  private startRaf(): void {
    if (this.rafId !== null) {
      return;
    }
    const tick = () => {
      if (!this.active) {
        this.stopRaf();
        return;
      }
      const speaking = this.computeSpeaking();
      if (!speaking) {
        this.stopRaf();
        this.barScales = [0.65, 0.65, 0.65, 0.65];
        return;
      }

      const intensity = Math.min((this.volume || 0) / 80, 1);
      const t = performance.now() / 220;
      const targets: [number, number, number, number] = [0.35, 0.35, 0.35, 0.35];

      for (let i = 0; i < 4; i++) {
        const phase = i * 0.9;
        const w1 = (Math.sin(t * 1.35 + phase) + 1) / 2;
        const w2 = (Math.sin(t * 2.05 + phase * 1.7) + 1) / 2;
        const mix = w1 * 0.62 + w2 * 0.38;
        const s = 0.25 + intensity * (0.25 + 0.95 * mix);
        targets[i as 0 | 1 | 2 | 3] = Math.max(0.35, Math.min(1.2, s));
      }

      // Smooth toward targets to avoid jitter on rapid volume changes.
      const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
      this.barScales = [
        lerp(this.barScales[0], targets[0], 0.35),
        lerp(this.barScales[1], targets[1], 0.35),
        lerp(this.barScales[2], targets[2], 0.35),
        lerp(this.barScales[3], targets[3], 0.35),
      ];

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
