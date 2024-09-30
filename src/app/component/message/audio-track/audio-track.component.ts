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

  @Input() audioUrl: SafeUrl | null = null;
  @Input() rawAudioUrl: string | null = null;
  @Input() audioBlob: Blob | null = null;

  @Input() metadata: any | null = null;

  audioContext!: AudioContext;
  analyser!: AnalyserNode;
  bufferLength!: number;
  dataArray!: Uint8Array;
  audioBuffer!: AudioBuffer;

  audioDuration: number | null = null;
  currentTime: number = 0;
  isPlaying: boolean = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngAfterViewInit() {
    // Se l'audio è in formato Blob, creiamo un URL sicuro
    if (this.audioBlob) {
      this.rawAudioUrl = URL.createObjectURL(this.audioBlob);
      this.audioUrl = this.sanitizer.bypassSecurityTrustUrl(this.rawAudioUrl);
    }

    // Configura il contesto audio e decodifica l'audio
    this.setupAudioContext();
  }

  async setupAudioContext() {
    this.audioContext = new AudioContext();

    // Decodifica i dati dell'audio
    if (this.rawAudioUrl) {
      const response = await fetch(this.rawAudioUrl);
      const audioData = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(audioData);
      //this.audioDuration = this.audioBuffer.duration;
      this.getAudioDuration();
      // Visualizza la forma d'onda dell'audio caricato
      this.drawWaveform(this.audioBuffer);
    }
  }

  drawWaveform(audioBuffer: AudioBuffer) {
    const canvas = this.waveformCanvas.nativeElement;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
  
    const width = canvas.width;
    const height = canvas.height;
  
    // Dati dell'audio (canale 0 per tracce stereo o mono)
    const rawData = audioBuffer.getChannelData(0);
  
    // Riduci i dati a un numero di campioni gestibile per disegnare la forma d'onda
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
  
    // Pulisci il canvas
    canvasCtx.clearRect(0, 0, width, height);
  
    // Aggiungi il padding di 1px su entrambi i lati di ogni barra
    const padding = 0.5;
    const barWidth = (width / samples) - padding * 2; // Sottrai il padding dalla larghezza della barra
    
    // Calcola quale parte dell'audio è stata riprodotta
    const audio = this.audioElement.nativeElement;
    const playedPercent = audio.currentTime / audio.duration;
  
    // Disegna la forma d'onda con padding
    for (let i = 0; i < samples; i++) {
      var barHeight = waveform[i] * height;
      if (barHeight < 2) barHeight = 2;
      const x = i * (barWidth + padding * 2) + padding; // Sposta ogni barra di "padding" a destra
  
      // Imposta il colore: blu se non ancora riprodotto, rosso se già riprodotto
      if (i / samples < playedPercent) {
        canvasCtx.fillStyle = 'rgb(82, 160, 252)'; // Rosso per la parte già riprodotta
      } else {
        canvasCtx.fillStyle = 'rgba(82, 160, 252, 0.5)'; // Blu per la parte non ancora riprodotta
      }

      // Disegna la barra superiore (verso l'alto)
      canvasCtx.fillRect(x, height / 2 - barHeight, barWidth, barHeight);
      // Disegna la barra inferiore (verso il basso, riflessa)
      canvasCtx.fillRect(x, height / 2, barWidth, barHeight);
    }
  }

  drawWaveform2(audioBuffer: AudioBuffer) {
    const canvas = this.waveformCanvas.nativeElement;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
  
    const width = canvas.width;
    const height = canvas.height;
  
    // Dati dell'audio (canale 0 per tracce stereo o mono)
    const rawData = audioBuffer.getChannelData(0);
  
    // Riduci i dati a un numero di campioni gestibile per disegnare la forma d'onda
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
  
    // Pulisci il canvas
    canvasCtx.clearRect(0, 0, width, height);
  
    // Aggiungi il padding di 1px su entrambi i lati di ogni barra
    const padding = 0.5;
    const barWidth = (width / samples) - padding * 2; // Sottrai il padding dalla larghezza della barra
  
    // Disegna la forma d'onda con padding
    canvasCtx.fillStyle = 'rgb(0, 200, 255)';
  
    for (let i = 0; i < samples; i++) {
      var barHeight = waveform[i] * height;
      if(barHeight<2)barHeight = 2;
      const x = i * (barWidth + padding * 2) + padding; // Sposta ogni barra di "padding" a destra
      // Disegna la barra superiore (verso l'alto)
      canvasCtx.fillRect(x, height / 2 - barHeight, barWidth, barHeight);
      // Disegna la barra inferiore (verso il basso, riflessa)
      canvasCtx.fillRect(x, height / 2, barWidth, barHeight);
    }
    
  }

  playPauseAudio() {
    const audio = this.audioElement.nativeElement;

    if (audio.paused) {
      audio.play();
      this.isPlaying = true;
      this.audioContext.resume();
      this.updateWaveform();
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
    // Chiama drawWaveform per ridisegnare la forma d'onda con la nuova posizione di riproduzione
    this.drawWaveform(this.audioBuffer);
  
    // Continua ad aggiornare se l'audio è ancora in riproduzione
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

    // Quando i metadati sono caricati, ottieni la durata
    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration === Infinity) {
        // In alcuni casi, potrebbe essere necessario forzare il caricamento completo dei metadati
        audio.currentTime = Number.MAX_SAFE_INTEGER;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null; // Rimuovi l'evento
          audio.currentTime = 0;     // Reset del tempo
          this.audioDuration = audio.duration;
          console.log('Durata corretta:', this.audioDuration);
        };
      } else {
        // Se la durata è già correttamente calcolata
        this.audioDuration = audio.duration;
        console.log('Durata dell\'audio:', this.audioDuration);
      }
    });
  }
}
