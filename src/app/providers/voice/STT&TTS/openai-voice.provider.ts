import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

import type { OpenAiVoiceEnvironmentConfig } from './openai-voice.config';
import {
  SpeechToTextProvider,
  TextToSpeechProvider,
  type SpeechToTextRequest,
  type SpeechToTextResult,
  type TextToSpeechRequest,
  type TextToSpeechResult,
} from './speech-provider.abstract';
import { AppConfigService } from '../../app-config.service';

const DEFAULT_BASE = 'https://api.openai.com/v1';
const DEFAULT_TRANSCRIPTION_MODEL = 'whisper-1';
const DEFAULT_TTS_MODEL = 'tts-1';
const DEFAULT_VOICE = 'alloy';
const DEFAULT_FORMAT = 'mp3';

/**
 * Provider OpenAI unico: STT (Whisper) + TTS, entrambi via {@link HttpClient}.
 */
@Injectable({ providedIn: 'root' })
export class OpenAiVoiceProviderService extends SpeechToTextProvider implements TextToSpeechProvider {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appConfig: AppConfigService
  ) {
    super();
  }

  async transcribe(request: SpeechToTextRequest): Promise<SpeechToTextResult> {
    const cfg = this.getConfig();
    const apiKey = cfg.apiKey?.trim();
    if (!apiKey) {
      return { text: '' };
    }

    const base = (cfg.baseUrl ?? DEFAULT_BASE).replace(/\/$/, '');
    const model = cfg.transcriptionModel ?? DEFAULT_TRANSCRIPTION_MODEL;
    const url = `${base}/audio/transcriptions`;

    const ext = this.extensionForMime(request.mimeType);
    const file = new File([request.audio], `segment.${ext}`, { type: request.mimeType });

    const form = new FormData();
    form.append('file', file);
    form.append('model', model);
    if (request.language) {
      form.append('language', request.language);
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${apiKey}`,
    });

    try {
      const data = await firstValueFrom(
        this.httpClient.post<{ text?: string }>(url, form, { headers }),
      );
      return { text: (data.text ?? '').trim() };
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.error instanceof Blob) {
        const errText = await e.error.text();
        throw new Error(`OpenAI transcription ${e.status}: ${errText || e.statusText}`);
      }
      throw this.mapOpenAiHttpError(e);
    }
  }

  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const cfg = this.getConfig();
    const apiKey = cfg.apiKey?.trim();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured (environment.openAiVoice.apiKey)');
    }

    const base = (cfg.baseUrl ?? DEFAULT_BASE).replace(/\/$/, '');
    const model = cfg.ttsModel ?? DEFAULT_TTS_MODEL;
    const voice = request.voice ?? cfg.ttsVoice ?? DEFAULT_VOICE;
    const responseFormat =
      (request.responseFormat as 'mp3' | 'opus' | 'aac' | 'flac' | undefined) ?? DEFAULT_FORMAT;
    const url = `${base}/audio/speech`;

    const body = {
      model,
      voice,
      input: request.text,
      response_format: responseFormat,
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    });

    try {
      const blob = await firstValueFrom(
        this.httpClient.post(url, body, {
          headers,
          responseType: 'blob',
        }),
      );
      return { audio: blob, mimeType: this.mimeForFormat(responseFormat) };
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.error instanceof Blob) {
        const errText = await e.error.text();
        throw new Error(`OpenAI TTS ${e.status}: ${errText || e.statusText}`);
      }
      if (e instanceof HttpErrorResponse) {
        throw new Error(`OpenAI TTS ${e.status}: ${e.message || e.statusText}`);
      }
      throw e;
    }
  }

  private getConfig(): OpenAiVoiceEnvironmentConfig {
    return this.appConfig.getConfig().openAiKey ?? {};
  }

  private mapOpenAiHttpError(e: unknown): Error {
    if (!(e instanceof HttpErrorResponse)) {
      return e instanceof Error ? e : new Error(String(e));
    }
    const label = 'OpenAI transcription';
    if (e.error instanceof Blob) {
      return new Error(`${label} ${e.status}: ${e.statusText}`);
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
    if (mime.includes('webm')) {
      return 'webm';
    }
    if (mime.includes('mp4') || mime.includes('m4a')) {
      return 'm4a';
    }
    if (mime.includes('wav')) {
      return 'wav';
    }
    if (mime.includes('mpeg') || mime.includes('mp3')) {
      return 'mp3';
    }
    return 'webm';
  }

  private mimeForFormat(fmt: string): string {
    switch (fmt) {
      case 'opus':
        return 'audio/opus';
      case 'aac':
        return 'audio/aac';
      case 'flac':
        return 'audio/flac';
      case 'mp3':
      default:
        return 'audio/mpeg';
    }
  }
}
