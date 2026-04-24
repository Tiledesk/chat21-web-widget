import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

/**
 * Garantisce un solo messaggio TTS in riproduzione alla volta.
 * Se arrivano più messaggi TTS, vengono riprodotti in coda (FIFO) senza interrompere quello corrente.
 */
@Injectable({ providedIn: 'root' })
export class TtsAudioPlaybackCoordinator {
  private currentOwnerId: string | null = null;
  private readonly queue: Array<{ ownerId: string; start: () => void }> = [];

  private readonly cancelAllSource = new Subject<void>();
  /** Emesso quando la riproduzione TTS va interrotta globalmente (es. l’utente parla al microfono). */
  readonly cancelAll$: Observable<void> = this.cancelAllSource.asObservable();

  /** Emits true while any TTS is playing or queued; false when the queue is fully drained. */
  private readonly _isTTSPlaying$ = new BehaviorSubject<boolean>(false);
  readonly isTTSPlaying$ = this._isTTSPlaying$.asObservable();

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
    this._isTTSPlaying$.next(true);
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
      this._isTTSPlaying$.next(false);
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

  /**
   * Interrompe TUTTA la riproduzione TTS (corrente + coda) e notifica i componenti.
   * I componenti devono fermare l’audio e mostrare il testo per intero.
   */
  cancelAll(): void {
    this.queue.splice(0, this.queue.length);
    this.currentOwnerId = null;
    this.cancelAllSource.next();
  }
}
