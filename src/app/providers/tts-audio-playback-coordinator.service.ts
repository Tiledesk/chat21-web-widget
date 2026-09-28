import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

/**
 * Garantisce un solo messaggio TTS in riproduzione alla volta.
 * Quando arriva un nuovo messaggio TTS mentre un altro è in corso, quello vecchio viene
 * interrotto immediatamente (preemption) e il nuovo parte subito.
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

  /** Emits once when stopAll() is called — signals every AudioSyncComponent to abort immediately. */
  private readonly _stopAll$ = new Subject<void>();
  readonly stopAllPlayback$: Observable<void> = this._stopAll$.asObservable();

  /**
   * Emits the ownerId of the component being preempted (stopped mid-playback by a newer message).
   * Only the component whose ownerId matches should react — unlike stopAll$ which targets everyone.
   */
  private readonly _preemptCurrent$ = new Subject<string>();
  readonly preemptPlayback$: Observable<string> = this._preemptCurrent$.asObservable();

  /**
   * Richiede l'avvio della riproduzione TTS per `ownerId`.
   * Se un altro TTS è già in corso, viene interrotto immediatamente (preemption) e
   * `ownerId` parte subito. Qualsiasi coda pendente viene svuotata.
   */
  requestStart(ownerId: string, start: () => void): void {
    const id = (ownerId || '').trim();
    if (!id) {
      return;
    }
    if (this.currentOwnerId === id) {
      return;
    }

    if (this.currentOwnerId) {
      // Preempt: signal only the evicted owner to stop (not a broadcast stopAll).
      // This avoids stopping the component that is about to start playing.
      const evicted = this.currentOwnerId;
      this.queue.length = 0;
      this.currentOwnerId = null;
      this._preemptCurrent$.next(evicted);
    } else {
      this.queue.length = 0;
    }

    this.currentOwnerId = id;
    if (!this._isTTSPlaying$.getValue()) {
      this._isTTSPlaying$.next(true);
    }
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
    this.stopAll();
    this.cancelAllSource.next();
  }

  /**
   * Stops all TTS playback immediately and clears the queue.
   * Broadcasts on stopAllPlayback$ so every AudioSyncComponent can abort its stream and reveal all text.
   */
  stopAll(): void {
    this.queue.length = 0;
    this.currentOwnerId = null;
    this._isTTSPlaying$.next(false);
    this._stopAll$.next();
  }
}
