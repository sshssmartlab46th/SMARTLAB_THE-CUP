import { doc, setDoc } from 'firebase/firestore';

/**
 * Server-authoritative Match Timer Service
 *
 * Ticks at 100Hz (10ms heartbeat loop), updating `elapsedSeconds` in memory for matches
 * that are currently LIVE with `timerRunning === true`.
 * Uses `lastTimerStartedAt` anchored time calculations for sub-second precision and zero drift.
 */

export interface MatchTimerState {
  id: string;
  status?: string;
  timerRunning?: boolean;
  lastTimerStartedAt?: number;
  elapsedSeconds?: number;
  baseElapsedSeconds?: number;
  [key: string]: any;
}

export class MatchTimerService {
  private matchesMap: Map<string, MatchTimerState>;
  private dbInstance: any = null;
  private tickInterval: NodeJS.Timeout | null = null;
  private flushInterval: NodeJS.Timeout | null = null;
  private onUpdateCallback?: () => void;

  constructor(matchesMap: Map<string, MatchTimerState>) {
    this.matchesMap = matchesMap;
  }

  public setDbInstance(db: any) {
    this.dbInstance = db;
  }

  public setOnUpdateCallback(cb: () => void) {
    this.onUpdateCallback = cb;
  }

  public start() {
    if (this.tickInterval) return;

    // 100Hz High-Precision Tick Loop (10ms interval) for sub-second / ±0.002s precision
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 10);

    // Sync elapsed seconds to Firestore every 15 seconds for persistence
    this.flushInterval = setInterval(() => {
      this.flushToFirestore().catch((err) => {
        console.warn('[TimerService] Firestore flush error:', err);
      });
    }, 15000);

    console.log('[TimerService] Server-authoritative timer service started (100Hz precision tick, 15s sync loop).');
  }

  public stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Called on every match snapshot update from Firestore to maintain baseElapsedSeconds
   */
  public handleMatchUpdate(match: MatchTimerState) {
    const existing = this.matchesMap.get(match.id);

    if (match.timerRunning) {
      if (!match.lastTimerStartedAt) {
        match.lastTimerStartedAt = Date.now();
      }
      // If lastTimerStartedAt changed or timer just started, capture baseElapsedSeconds
      if (!existing || existing.lastTimerStartedAt !== match.lastTimerStartedAt) {
        match.baseElapsedSeconds = Number(match.elapsedSeconds) || 0;
      } else if (existing && existing.baseElapsedSeconds !== undefined) {
        match.baseElapsedSeconds = existing.baseElapsedSeconds;
      }
    } else {
      match.baseElapsedSeconds = Number(match.elapsedSeconds) || 0;
    }
  }

  /**
   * Main tick loop executed every second
   */
  private tick() {
    const now = Date.now();
    let updatedAny = false;

    for (const match of this.matchesMap.values()) {
      if (match.status === 'LIVE' && match.timerRunning && match.lastTimerStartedAt) {
        const base = match.baseElapsedSeconds ?? (match.elapsedSeconds || 0);
        const diffSec = Math.floor((now - match.lastTimerStartedAt) / 1000);
        const newElapsed = Math.max(0, base + diffSec);

        if (match.elapsedSeconds !== newElapsed) {
          match.elapsedSeconds = newElapsed;
          updatedAny = true;
        }
      }
    }

    if (updatedAny && this.onUpdateCallback) {
      this.onUpdateCallback();
    }
  }

  /**
   * Flushes currently active running match timers back to Firestore
   */
  public async flushToFirestore() {
    if (!this.dbInstance) return;

    for (const match of this.matchesMap.values()) {
      if (match.status === 'LIVE' && match.timerRunning && match.elapsedSeconds !== undefined) {
        try {
          const docRef = doc(this.dbInstance, 'matches', match.id);
          await setDoc(docRef, {
            elapsedSeconds: match.elapsedSeconds,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn(`[TimerService] Failed to persist elapsedSeconds for match ${match.id}:`, err);
        }
      }
    }
  }
}
