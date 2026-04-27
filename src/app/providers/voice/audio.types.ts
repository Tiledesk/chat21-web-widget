/**
 * Tipi condivisi per cattura microfono, VAD e registrazione (WebM).
 */
import type { VoiceStreamingSessionConfig } from './voice-streaming.types';

export const DEFAULT_VOICE_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export const DEFAULT_VOICE_MEDIA_STREAM_CONSTRAINTS: MediaStreamConstraints = {
  audio: DEFAULT_VOICE_AUDIO_CONSTRAINTS,
};

export interface VoiceRecordedBlob {
  blob: Blob;
  mimeType: string;
}

/**
 * Segmento audio dopo VAD; può includere `transcript` se STT è configurato e abilitato.
 */
export interface VoiceSegmentPayload extends VoiceRecordedBlob {
  transcript?: string;
  transcriptionError?: string;
}

export interface VoiceSessionStartOptions {
  /** Opzionale se usi solo {@link VoiceService.audioSegment$}. */
  onRecordingComplete?: (result: VoiceSegmentPayload) => void;
  constraints?: MediaStreamConstraints;
  /** Default `true`. Se `false`, non viene chiamato lo STT sul segmento. */
  enableTranscription?: boolean;
  /**
   * Con `voiceIngressStream`: solo streaming WSS — niente VAD locale; transcript e TTS dal server.
   * Senza: MicVAD + segmenti e upload/STT lato client.
   */
  voiceIngressStream?: VoiceStreamingSessionConfig | null;
}
