import { Component, EventEmitter, Output } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'chat-audio-recorder',
  templateUrl: './audio-recorder.component.html',
  styleUrls: ['./audio-recorder.component.scss']
})
export class AudioRecorderComponent {

  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  isRecording = false;
  audioUrl: SafeUrl | null = null;
  audioBlob: Blob | null = null;

  @Output() startRecordingEvent = new EventEmitter<void>();
  @Output() deleteRecordingEvent = new EventEmitter<void>();
  @Output() endRecordingEvent = new EventEmitter<Blob | null>();
  @Output() sendRecordingEvent = new EventEmitter<Blob | null>();
  

  constructor(private sanitizer: DomSanitizer) {}

  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.start();
        this.isRecording = true;
        this.startRecordingEvent.emit();

        this.mediaRecorder.addEventListener('dataavailable', (event) => {
          this.audioChunks.push(event.data);
        });

        this.mediaRecorder.addEventListener('stop', () => {
          this.audioBlob = new Blob(this.audioChunks, { type: 'audio/mpeg' });
          const audioBlobUrl = URL.createObjectURL(this.audioBlob);
          // Utilizza il sanitizer per "bypassare" la sanificazione di Angular
          this.audioUrl = this.sanitizer.bypassSecurityTrustUrl(audioBlobUrl);
          this.audioChunks = []; // Resetta i chunks per la prossima registrazione
          this.endRecordingEvent.emit(this.audioBlob);
        });
      })
      .catch(error => {
        console.error('Errore nell’accesso al microfono:', error);
      });
  }

  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  deleteRecording() {
    this.audioUrl = null;
    this.deleteRecordingEvent.emit(null);
  }

  sendMessage(){
    if (this.audioUrl) {
      this.sendRecordingEvent.emit(this.audioBlob);
      this.audioUrl = null;
    }
  }
}