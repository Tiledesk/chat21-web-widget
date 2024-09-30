import { Component, ElementRef, EventEmitter, Output, ViewChild, AfterViewInit } from '@angular/core';

import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { setTimeout } from 'timers';

@Component({
  selector: 'chat-audio-recorder',
  templateUrl: './audio-recorder.component.html',
  styleUrls: ['./audio-recorder.component.scss']
})
export class AudioRecorderComponent implements AfterViewInit{
  @ViewChild('audioElement') audioElement!: ElementRef<HTMLAudioElement>;
  @ViewChild('waveformCanvas') waveformCanvas!: ElementRef<HTMLCanvasElement>;

  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  audioBlob: Blob | null = null;
  audioUrl: SafeUrl | null = null;
  audioDuration: number | null = null;
  audioContext: AudioContext | null = null;
  audioSource: AudioBufferSourceNode | null = null;
  analyser: AnalyserNode | null = null;
  dataArray: Uint8Array | null = null;

  isRecording = false;
  rawAudioUrl: string | null = null;
  currentTime: number = 0;
  isPlaying: boolean = false;

  @Output() startRecordingEvent = new EventEmitter<void>();
  @Output() deleteRecordingEvent = new EventEmitter<void>();
  @Output() endRecordingEvent = new EventEmitter<Blob | null>();
  @Output() sendRecordingEvent = new EventEmitter<Blob | null>();
  

  constructor(private sanitizer: DomSanitizer) {}


  ngAfterViewInit(): void {
    if (this.audioUrl) {
      this.setupAnalyser();  // Inizializza l'analizzatore solo dopo che la vista è stata caricata
    }
  }

  setupAnalyser() {
    // Controlla che l'audio sia già stato caricato
    if (!this.audioUrl) {
      console.error("URL dell'audio non disponibile");
      return;
    }

    // Crea un contesto audio
    this.audioContext = new AudioContext();

    // Crea un elemento audio e connettilo al contesto audio
    const audioElement = this.audioElement.nativeElement;

    // Crea un MediaElementAudioSourceNode dall'elemento audio
    const audioSource = this.audioContext.createMediaElementSource(audioElement);

    // Crea un nodo AnalyserNode
    this.analyser = this.audioContext.createAnalyser();
    audioSource.connect(this.analyser);

    // Collega l'analyser all'uscita audio (destination)
    this.analyser.connect(this.audioContext.destination);

    // Configura l'analyser per la visualizzazione dell'onda
    this.analyser.fftSize = 2048;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    // Inizia a disegnare l'onda audio
    this.drawWaveform();
  }
  

  drawWaveform() {
    const canvas = this.waveformCanvas.nativeElement;
    const canvasCtx = canvas.getContext('2d');
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const audioElement = this.audioElement.nativeElement;

    const draw = () => {
      if (!this.analyser || !this.dataArray) return;

      requestAnimationFrame(draw);

      this.analyser.getByteTimeDomainData(this.dataArray);

      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

      canvasCtx.beginPath();

      const sliceWidth = WIDTH / this.dataArray.length;
      let x = 0;

      for (let i = 0; i < this.dataArray.length; i++) {
        const v = this.dataArray[i] / 128.0;
        const y = (v * HEIGHT) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(WIDTH, HEIGHT / 2);
      canvasCtx.stroke();

      // Aggiungi un cerchio che rappresenta il pallino che si muove
      const progress = audioElement.currentTime / audioElement.duration;
      const circleX = progress * WIDTH;
      canvasCtx.beginPath();
      canvasCtx.arc(circleX, HEIGHT / 2, 5, 0, 2 * Math.PI);
      canvasCtx.fillStyle = 'red';
      canvasCtx.fill();
    };
    draw();
  }




  startRecording() {
    console.log('startRecording');
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.start();
        this.isRecording = true;
        this.startRecordingEvent.emit();
        this.mediaRecorder.addEventListener('dataavailable', (event) => {
          console.log('dataavailable');
          this.audioChunks.push(event.data);
        });

        this.mediaRecorder.addEventListener('stop', () => {
          console.log('mediaRecorder stop');
          this.audioBlob = new Blob(this.audioChunks, { type: 'audio/mpeg' });
          this.rawAudioUrl = URL.createObjectURL(this.audioBlob);
          this.audioUrl = this.sanitizer.bypassSecurityTrustUrl(this.rawAudioUrl);
          this.audioChunks = []; 
          //this.getAudioDuration();
          this.endRecordingEvent.emit(this.audioBlob);
          //this.setupAnalyser();
          //this.drawWaveform();
        });
      })
      .catch(error => {
        console.error('Errore nell’accesso al microfono:', error);
      });
  }

  stopRecording() {
    console.log('stopRecording ');
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      console.log('chiudo');
    }
  }

  deleteRecording() {
    this.audioUrl = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.rawAudioUrl = null;
    this.audioUrl = null;
    this.audioBlob = null;
    this.deleteRecordingEvent.emit(null);
  }

  sendMessage(){
    if (this.audioUrl) {
      this.sendRecordingEvent.emit(this.audioBlob);
      this.audioUrl = null;
    }
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

  playPauseAudio() {
    const audio = this.audioElement.nativeElement;
    if (audio.paused) {
      audio.play();
      this.isPlaying = true;
      this.audioContext?.resume();
    } else {
      audio.pause();
      this.isPlaying = false;
    }
    audio.ontimeupdate = () => {
      this.currentTime = audio.currentTime;
    };
  }


  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${minutes}:${sec < 10 ? '0' + sec : sec}`;
  }
}