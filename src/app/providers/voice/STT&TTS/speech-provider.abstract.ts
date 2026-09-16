/**
 * Contratti astratti per Speech-to-Text e Text-to-Speech.
 * Implementazione OpenAI unificata: `OpenAiVoiceProviderService` (`openai-voice.provider.ts`).
 */

/** Input per la trascrizione di un segmento audio. */
export interface SpeechToTextRequest {
  audio: Blob;
  mimeType: string;
  /** ISO 639-1 opzionale (es. `it`, `en`). */
  language?: string;
}

export interface SpeechToTextResult {
  text: string;
}

/** Input per la sintesi vocale. */
export interface TextToSpeechRequest {
  text: string;
  /** Voce provider-specific (es. OpenAI: `alloy`, `echo`, …). */
  voice?: string;
  language?: string;
  /** Formato audio desiderato (dipende dal provider). */
  responseFormat?: string;
}

export interface TextToSpeechResult {
  audio: Blob;
  mimeType: string;
}

export abstract class SpeechToTextProvider {
  abstract transcribe(request: SpeechToTextRequest): Promise<SpeechToTextResult>;
}

export abstract class TextToSpeechProvider {
  abstract synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult>;
}
