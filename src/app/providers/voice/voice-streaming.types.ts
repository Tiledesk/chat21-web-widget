/**
 * Configurazione sessione WSS /ws/voice.
 *
 * L'URL di connessione porta solo: token, mimeType, sttProvider, ttsProvider (ADR-002).
 * I campi di identità di sessione viaggiano nel config frame JSON inviato subito dopo onopen.
 */
export interface VoiceStreamingSessionConfig {
  /** JWT auth token — finisce in `?token=` nell'URL. */
  token: string;
  /** Chat21 userId — campo `sender` del config frame. */
  sender: string;
  /** Chat21 conversationId, es. `support-group-<projectId>-<requestId>` — campo `recipient` del config frame. */
  recipient: string;
  /** Codice lingua BCP-47, default `'en'` — campo `lang` del config frame. */
  lang?: string;
  sttProvider?: string;
  ttsProvider?: string;
  /**
   * Base URL del WebSocket *senza* query, incluso path.
   * Esempio: `wss://proxy.example.com/ws/voice` o `ws://127.0.0.1:4587/ws/voice` (mock locale)
   * Se assente, si usa `voiceProxyWsBaseUrl` dal widget config caricato con `AppConfigService.getConfig()`.
   */
  wsBaseUrl?: string;
  /** Default 250 — intervallo `MediaRecorder.start(timeslice)` in ms */
  timesliceMs?: number;
  /** Se valorizzato, ha precedenza sulle euristiche (es. `audio/webm;codecs=opus`) */
  mimeType?: string;
}

export type VoiceStreamingConnectionState =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'streaming'
  | 'stopping'
  | 'closed'
  | 'error';

export interface VoiceStreamingServerMessage {
  /** Originale: text JSON o testo, binary come ArrayBuffer */
  data: string | ArrayBuffer;
  isBinary: boolean;
}

export interface VoiceStreamingStopOptions {
  discard?: boolean;
  /** Dopo `MediaRecorder.stop`, attende un messaggio testuale dal server con l’URL (JSON `url` / `audioUrl` / …) prima di chiudere il socket */
  awaitServerResultUrl?: boolean;
  serverResultTimeoutMs?: number;
}

export interface VoiceStreamingStopResult {
  blob: Blob | null;
  mimeType: string;
  /** Estratto dal messaggio testuale del server al termine dello stream, se `awaitServerResultUrl` e protocollo coerente */
  resultUrl: string | null;
}

/** Messaggio di controllo JSON dal proxy voce (`msg.event`). */
export type VoiceWsServerEventName =
  | 'session_started'
  | 'listening'
  | 'transcript'
  | 'thinking'
  | 'speaking'
  | 'done'
  | 'error';

/** Messaggio di controllo JSON dal proxy (`msg.event`); altri campi sono ignorati se non gestiti. */
export type VoiceWsControlMessage = {
  event: VoiceWsServerEventName;
  requestId?: string;
  text?: string;
  isFinal?: boolean;
  message?: string;
} & Record<string, unknown>;
