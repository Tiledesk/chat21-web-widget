import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

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

  spectrumLinePath = 'M0,16 L100,16';

  ngOnInit(): void {
    this.refreshPath();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['volume']) {
      this.refreshPath();
    }
  }

  private refreshPath(): void {
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
}
