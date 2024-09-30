import { Component, ElementRef, AfterViewInit, Input, ViewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'chat-audio-track',
  templateUrl: './audio-track.component.html',
  styleUrls: ['./audio-track.component.scss']
})
export class AudioTrackComponent implements AfterViewInit {

  @ViewChild('audioElement', { static: true }) audioElement!: ElementRef<HTMLAudioElement>;
  @ViewChild('canvasElement', { static: true }) waveformCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() audioBlob: Blob | null = null;
  @Input() metadata: any | null = null;

  audioUrl: SafeUrl | null = null;
  rawAudioUrl: string | null = null;
  audioContext!: AudioContext;
  audioBuffer!: AudioBuffer;
  audioDuration: number | null = null;
  currentTime: number = 0;
  isPlaying: boolean = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngAfterViewInit() {
    if (this.audioBlob) {
      this.rawAudioUrl = URL.createObjectURL(this.audioBlob);
      this.audioUrl = this.sanitizer.bypassSecurityTrustUrl(this.rawAudioUrl);
      this.setupAudioContext();
    }
  }

  async setupAudioContext() {
    this.audioContext = new AudioContext();
    if (this.rawAudioUrl) {
      const response = await fetch(this.rawAudioUrl);
      const audioData = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(audioData);
      this.getAudioDuration();
      this.drawWaveform(this.audioBuffer);
    }
  }

  drawWaveform(audioBuffer: AudioBuffer) {
    const canvas = this.waveformCanvas.nativeElement;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    const width = canvas.width;
    const height = canvas.height;
    const rawData = audioBuffer.getChannelData(0);

    const samples = 70;
    const blockSize = Math.floor(rawData.length / samples);
    const waveform = new Float32Array(samples);
  
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[i * blockSize + j]);
      }
      waveform[i] = sum / blockSize;
    }

    canvasCtx.clearRect(0, 0, width, height);
    const padding = 0.5;
    const barWidth = (width / samples) - padding * 2;
    const audio = this.audioElement.nativeElement;
    const playedPercent = audio.currentTime / this.audioDuration;
    // console.log('playedPercent: ', audio.currentTime, this.audioDuration);
    
    for (let i = 0; i < samples; i++) {
      var barHeight = waveform[i] * height;
      if (barHeight < 2) barHeight = 2;
      const x = i * (barWidth + padding * 2) + padding;

      if (i / samples < playedPercent) {
        canvasCtx.fillStyle = 'rgb(82, 160, 252)';
      } else {
        canvasCtx.fillStyle = 'rgba(82, 160, 252, 0.5)';
      }
      canvasCtx.fillRect(x, height / 2 - barHeight, barWidth, barHeight);
      canvasCtx.fillRect(x, height / 2, barWidth, barHeight);
    }
  }

  playPauseAudio() {
    const audio = this.audioElement.nativeElement;
    if (audio.paused) {
      this.isPlaying = true;
      this.updateWaveform();
      audio.play();
      this.audioContext.resume();
    } else {
      audio.pause();
      this.isPlaying = false;
    }
    audio.ontimeupdate = () => {
      this.currentTime = audio.currentTime;
      this.updateWaveform(); 
    };
    audio.onended = () => {
      this.isPlaying = false;
    };
  }


  updateWaveform() {
    this.drawWaveform(this.audioBuffer);
    if (this.isPlaying) {
      requestAnimationFrame(() => this.updateWaveform());
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${minutes}:${sec < 10 ? '0' + sec : sec}`;
  }

  getAudioDuration() {
    const audio = new Audio();
    audio.src = this.rawAudioUrl!;
    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration === Infinity) {
        audio.currentTime = Number.MAX_SAFE_INTEGER;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null; 
          audio.currentTime = 0;
          this.audioDuration = audio.duration;
        };
      } else {
        this.audioDuration = audio.duration;
      }
    });
  }
}
