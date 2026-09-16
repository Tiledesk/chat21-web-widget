/**
 * Configurazione opzionale per i servizi voce OpenAI (da `environment` o runtime).
 */
export interface OpenAiVoiceEnvironmentConfig {
  /** Obbligatoria per chiamate API reali; se assente, STT/TTS non inviano richieste. */
  apiKey?: string;
  baseUrl?: string;
  transcriptionModel?: string;
  ttsModel?: string;
  /** Voce predefinita TTS (es. `alloy`). */
  ttsVoice?: string;
}
