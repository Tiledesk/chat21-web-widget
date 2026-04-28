/**
 * Configurazione sessione WSS /ws/voice.
 *
 * L'URL di connessione porta solo: token, mimeType, sttProvider, ttsProvider (ADR-002).
 * I campi di identità di sessione viaggiano nel config frame JSON inviato subito dopo onopen.
 *
 * Il config frame fonde i campi di routing Chat21 (`sender`, `recipient`, `lang`) con la struttura
 * prodotta da `chat21client.js#sendMessage` (`text`, `type`, `recipient_fullname`, `sender_fullname`,
 * `attributes`, `metadata`, `channel_type`), così il proxy riceve lo stesso payload di un normale
 * messaggio Chat21.
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
  /** Default 1000 — intervallo `MediaRecorder.start(timeslice)` in ms */
  timesliceMs?: number;
  /** Se valorizzato, ha precedenza sulle euristiche (es. `audio/webm;codecs=opus`) */
  mimeType?: string;

  // ── Campi sendMessage (chat21client.js#sendMessage outgoing_message) ──────────────────────────
  /** Testo del messaggio — default `""` per il config frame. Corrisponde a `text` in `sendMessage`. */
  text?: string;
  /** Tipo del messaggio — default `"text"`. Corrisponde a `type` in `sendMessage`. */
  type?: string;
  /** Nome completo del destinatario. Corrisponde a `recipient_fullname` in `sendMessage`. */
  recipient_fullname?: string;
  /** Nome completo del mittente. Corrisponde a `sender_fullname` in `sendMessage`. */
  sender_fullname?: string;
  /** Attributi del messaggio (es. lingua, info utente). Corrisponde a `attributes` in `sendMessage`. */
  attributes?: Record<string, unknown>;
  /** Metadata del messaggio — default `""`. Corrisponde a `metadata` in `sendMessage`. */
  metadata?: unknown;
  /** Tipo di canale (es. `"direct"`). Corrisponde a `channel_type` in `sendMessage`. */
  channel_type?: string;
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
  | 'ready'
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
