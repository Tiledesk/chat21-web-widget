import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  SpeechToTextProvider,
  TextToSpeechProvider,
  type SpeechToTextRequest,
  type SpeechToTextResult,
  type TextToSpeechRequest,
  type TextToSpeechResult,
} from './speech-provider.abstract';
import { AppConfigService } from '../../app-config.service';

/**
 * Routes STT and TTS calls through the tiledesk-speech-proxy.
 *
 * STT: POST <proxyBase>/api/stt  — multipart/form-data, field "audio"
 * TTS: POST <proxyBase>/api/tts  — JSON body { text, ... }
 */
@Injectable({ providedIn: 'root' })
export class OpenAiVoiceProviderService extends SpeechToTextProvider implements TextToSpeechProvider {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appConfig: AppConfigService,
  ) {
    super();
  }

  async transcribe(request: SpeechToTextRequest): Promise<SpeechToTextResult> {
    const proxyBase = this.proxyBase();
    if (!proxyBase) {
      return { text: '' };
    }

    const url = `${proxyBase}/api/stt`;
    const ext = this.extensionForMime(request.mimeType);
    const file = new File([request.audio], `segment.${ext}`, { type: request.mimeType });

    const form = new FormData();
    form.append('audio', file);
    if (request.language) {
      form.append('language', request.language);
    }
    const projectId = String(this.appConfig.g?.projectid ?? '').trim();
    if (projectId) form.append('projectId', projectId);
    const requestId = this.parseRequestId(this.appConfig.g?.recipientId ?? '');
    if (requestId) {
      form.append('requestId', requestId);
    }

    const headers = new HttpHeaders({ Authorization: this.authHeader() });

    try {
      const data = await firstValueFrom(
        this.httpClient.post<{ transcript?: string }>(url, form, { headers }),
      );
      return { text: (data.transcript ?? '').trim() };
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.error instanceof Blob) {
        const errText = await e.error.text();
        throw new Error(`Speech proxy STT ${e.status}: ${errText || e.statusText}`);
      }
      throw this.mapHttpError('Speech proxy STT', e);
    }
  }

  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const proxyBase = this.proxyBase();
    if (!proxyBase) {
      throw new Error('voiceProxyApiBaseUrl not configured');
    }

    const url = `${proxyBase}/api/tts`;
    const body: Record<string, unknown> = { text: request.text };
    if (request.language) body['language'] = request.language;
    if (request.voice) body['voiceId'] = request.voice;
    if (request.responseFormat) body['outputFormat'] = request.responseFormat;
    const projectId = String(this.appConfig.g?.projectid ?? '').trim();
    if (projectId) body['projectId'] = projectId;
    const requestId = this.parseRequestId(this.appConfig.g?.recipientId ?? '');
    if (requestId) body['requestId'] = requestId;

    const headers = new HttpHeaders({
      Authorization: this.authHeader(),
      'Content-Type': 'application/json',
    });

    try {
      const blob = await firstValueFrom(
        this.httpClient.post(url, body, { headers, responseType: 'blob' }),
      );
      return { audio: blob, mimeType: this.mimeForFormat(request.responseFormat ?? 'mp3') };
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.error instanceof Blob) {
        const errText = await e.error.text();
        throw new Error(`Speech proxy TTS ${e.status}: ${errText || e.statusText}`);
      }
      throw this.mapHttpError('Speech proxy TTS', e);
    }
  }

  private proxyBase(): string | null {
    const base = String(this.appConfig.getConfig()?.voiceProxyApiBaseUrl ?? '').trim();
    return base ? base.replace(/\/$/, '') : null;
  }

  /** Returns `JWT <rawToken>`, stripping any existing prefix first. */
  private authHeader(): string {
    const raw = (
      String(this.appConfig.g?.tiledeskToken ?? this.appConfig.g?.jwt ?? '').trim()
    ).replace(/^(JWT|Bearer)\s+/i, '').trim();
    return raw ? `JWT ${raw}` : '';
  }

  /**
   * Extracts the Tiledesk requestId from a Chat21 recipient string.
   * Format: `support-group-<projectId>-<requestId>`
   */
  private parseRequestId(recipient: string): string | null {
    const parts = recipient.split('-');
    if (parts.length < 4) return null;
    return parts.slice(3).join('-') || null;
  }

  private mapHttpError(label: string, e: unknown): Error {
    if (!(e instanceof HttpErrorResponse)) {
      return e instanceof Error ? e : new Error(String(e));
    }
    if (typeof e.error === 'object' && e.error !== null && 'error' in e.error) {
      const err = (e.error as { error?: { message?: string } }).error;
      return new Error(`${label} ${e.status}: ${err?.message ?? JSON.stringify(e.error)}`);
    }
    if (typeof e.error === 'string') {
      return new Error(`${label} ${e.status}: ${e.error}`);
    }
    return new Error(`${label} ${e.status}: ${e.message || e.statusText}`);
  }

  private extensionForMime(mime: string): string {
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a';
    if (mime.includes('wav')) return 'wav';
    if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
    return 'webm';
  }

  private mimeForFormat(fmt: string): string {
    switch (fmt) {
      case 'opus': return 'audio/opus';
      case 'aac':  return 'audio/aac';
      case 'flac': return 'audio/flac';
      default:     return 'audio/mpeg';
    }
  }
}
