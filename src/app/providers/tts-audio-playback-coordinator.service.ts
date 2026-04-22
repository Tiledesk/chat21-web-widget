import { Injectable } from '@angular/core';

/**
 * Garantisce un solo messaggio TTS in riproduzione alla volta.
 * Se arrivano più messaggi TTS, vengono riprodotti in coda (FIFO) senza interrompere quello corrente.
 */
@Injectable({ providedIn: 'root' })
export class TtsAudioPlaybackCoordinator {
  private currentOwnerId: string | null = null;
  private readonly queue: Array<{ ownerId: string; start: () => void }> = [];

  /**
   * Richiede l'avvio della riproduzione TTS per `ownerId`.
   * Se non c'è nessun TTS attivo, parte subito; altrimenti viene messo in coda.
   */
  requestStart(ownerId: string, start: () => void): void {
    const id = (ownerId || '').trim();
    if (!id) {
      return;
    }
    if (this.currentOwnerId === id) {
      return;
    }
    if (this.queue.some((j) => j.ownerId === id)) {
      return;
    }
    if (this.currentOwnerId) {
      this.queue.push({ ownerId: id, start });
      return;
    }
    this.currentOwnerId = id;
    try {
      start();
    } catch {
      this.releaseIfCurrent(id);
    }
  }

  /** Chiamare a fine riproduzione naturale (`ended`) se questo messaggio era ancora “attivo”. */
  releaseIfCurrent(ownerId: string): void {
    const id = (ownerId || '').trim();
    if (!id) {
      return;
    }
    if (this.currentOwnerId !== id) {
      // Se era in coda, rimuovilo.
      const idx = this.queue.findIndex((j) => j.ownerId === id);
      if (idx !== -1) {
        this.queue.splice(idx, 1);
      }
      return;
    }

    this.currentOwnerId = null;
    const next = this.queue.shift();
    if (!next) {
      return;
    }
    this.currentOwnerId = next.ownerId;
    try {
      next.start();
    } catch {
      this.releaseIfCurrent(next.ownerId);
    }
  }

  /** Distruzione componente o stop esplicito. */
  release(ownerId: string): void {
    this.releaseIfCurrent(ownerId);
  }
}
