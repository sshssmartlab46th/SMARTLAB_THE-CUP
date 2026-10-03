import { doc, setDoc } from 'firebase/firestore';

export interface CheerState {
  matchId: string;
  homeCheers: number;
  awayCheers: number;
  lastEmoji?: string;
  fiveMinIncrement?: number;
  fiveMinGrowthRate?: number;
  updatedAt?: string;
}

export class CheerService {
  private currentCheers = new Map<string, CheerState>();
  private dirtyMatches = new Set<string>();
  private previousCheersSnapshot = new Map<string, { home: number; away: number }>();
  private dbInstance: any = null;
  private flushTimer: NodeJS.Timeout | null = null;
  private growthTimer: NodeJS.Timeout | null = null;
  private onUpdateCallback?: () => void;
  private shutdownRegistered = false;

  constructor(dbInstance?: any) {
    if (dbInstance) {
      this.dbInstance = dbInstance;
    }
  }

  public setDbInstance(db: any): void {
    this.dbInstance = db;
  }

  public setOnUpdateCallback(cb: () => void): void {
    this.onUpdateCallback = cb;
  }

  /**
   * Restores initial cheer records from Firestore.
   */
  public restoreInitialState(records: Array<{ id: string; data: CheerState }>): void {
    for (const record of records) {
      const matchId = record.id;
      const data = record.data;
      const homeCheers = Number(data.homeCheers) || 0;
      const awayCheers = Number(data.awayCheers) || 0;

      this.currentCheers.set(matchId, {
        matchId,
        homeCheers,
        awayCheers,
        lastEmoji: data.lastEmoji || '🔥',
        fiveMinIncrement: data.fiveMinIncrement || 0,
        fiveMinGrowthRate: data.fiveMinGrowthRate || 0,
        updatedAt: data.updatedAt
      });

      this.previousCheersSnapshot.set(matchId, {
        home: homeCheers,
        away: awayCheers
      });
    }
  }

  /**
   * Updates state from external Firestore onSnapshot changes without marking dirty unnecessarily.
   */
  public handleExternalUpdate(matchId: string, data: CheerState): void {
    const existing = this.currentCheers.get(matchId);
    const incomingHome = Number(data.homeCheers) || 0;
    const incomingAway = Number(data.awayCheers) || 0;

    if (!existing) {
      this.currentCheers.set(matchId, {
        matchId,
        homeCheers: incomingHome,
        awayCheers: incomingAway,
        lastEmoji: data.lastEmoji || '🔥',
        fiveMinIncrement: data.fiveMinIncrement || 0,
        fiveMinGrowthRate: data.fiveMinGrowthRate || 0,
        updatedAt: data.updatedAt
      });
      if (this.onUpdateCallback) this.onUpdateCallback();
      return;
    }

    let changed = false;
    if (incomingHome > existing.homeCheers) {
      existing.homeCheers = incomingHome;
      changed = true;
    }
    if (incomingAway > existing.awayCheers) {
      existing.awayCheers = incomingAway;
      changed = true;
    }
    if (data.lastEmoji && data.lastEmoji !== existing.lastEmoji) {
      existing.lastEmoji = data.lastEmoji;
      changed = true;
    }

    if (changed && this.onUpdateCallback) {
      this.onUpdateCallback();
    }
  }

  /**
   * Increment cheer count for home or away team. Marks record dirty so it is flushed quickly to Firestore.
   */
  public incrementCheer(matchId: string, team: 'home' | 'away', emoji?: string): CheerState {
    let cheer = this.currentCheers.get(matchId);
    if (!cheer) {
      cheer = {
        matchId,
        homeCheers: 0,
        awayCheers: 0,
        lastEmoji: emoji || '🔥'
      };
      this.currentCheers.set(matchId, cheer);
    }

    if (team === 'home') {
      cheer.homeCheers += 1;
    } else if (team === 'away') {
      cheer.awayCheers += 1;
    }

    if (emoji) {
      cheer.lastEmoji = emoji;
    }

    this.dirtyMatches.add(matchId);

    if (this.onUpdateCallback) {
      this.onUpdateCallback();
    }

    return cheer;
  }

  public getCheer(matchId: string): CheerState | undefined {
    return this.currentCheers.get(matchId);
  }

  public getCheersMap(): Map<string, CheerState> {
    return this.currentCheers;
  }

  public getCheersRecord(): Record<string, CheerState> {
    return Object.fromEntries(this.currentCheers);
  }

  public isDirty(): boolean {
    return this.dirtyMatches.size > 0;
  }

  public getDirtyCount(): number {
    return this.dirtyMatches.size;
  }

  /**
   * Flushes dirty cheer records to Firestore (e.g. every 10s).
   */
  public async flushDirtyToFirestore(): Promise<number> {
    if (!this.dbInstance || this.dirtyMatches.size === 0) {
      return 0;
    }

    const matchIdsToFlush = Array.from(this.dirtyMatches);
    // Clear dirty set upfront so new increments during async writes are caught in next flush
    this.dirtyMatches.clear();

    const now = new Date().toISOString();
    let flushedCount = 0;

    for (const matchId of matchIdsToFlush) {
      const cheer = this.currentCheers.get(matchId);
      if (!cheer) continue;

      cheer.updatedAt = now;

      try {
        const docRef = doc(this.dbInstance, 'cheers', matchId);
        await setDoc(docRef, {
          matchId,
          homeCheers: cheer.homeCheers,
          awayCheers: cheer.awayCheers,
          lastEmoji: cheer.lastEmoji || '🔥',
          fiveMinIncrement: cheer.fiveMinIncrement || 0,
          fiveMinGrowthRate: cheer.fiveMinGrowthRate || 0,
          updatedAt: now
        }, { merge: true });
        flushedCount++;
      } catch (err) {
        console.error(`[CheerService] Error saving cheer doc for match ${matchId}:`, err);
        // Re-mark dirty so it retries on next flush
        this.dirtyMatches.add(matchId);
      }
    }

    return flushedCount;
  }

  /**
   * Calculates 5-minute increment and growth rate for all cheer records.
   */
  public async updateFiveMinGrowthRates(): Promise<void> {
    const now = new Date().toISOString();

    for (const [matchId, cheer] of this.currentCheers.entries()) {
      const prev = this.previousCheersSnapshot.get(matchId) || { home: 0, away: 0 };
      const currentTotal = cheer.homeCheers + cheer.awayCheers;
      const prevTotal = prev.home + prev.away;
      const fiveMinIncrement = Math.max(0, currentTotal - prevTotal);
      const growthRate = prevTotal > 0 ? Number(((fiveMinIncrement / prevTotal) * 100).toFixed(1)) : 0;

      cheer.fiveMinIncrement = fiveMinIncrement;
      cheer.fiveMinGrowthRate = growthRate;
      cheer.updatedAt = now;

      this.previousCheersSnapshot.set(matchId, {
        home: cheer.homeCheers,
        away: cheer.awayCheers
      });

      this.dirtyMatches.add(matchId);
    }

    await this.flushDirtyToFirestore();
  }

  /**
   * Starts periodic dirty flushing (default 10s) and 5-min growth rate updates (default 300s).
   */
  public start(flushIntervalMs = 10000, growthMetricsIntervalMs = 300000): void {
    this.stop();

    this.flushTimer = setInterval(() => {
      this.flushDirtyToFirestore();
    }, flushIntervalMs);

    this.growthTimer = setInterval(() => {
      this.updateFiveMinGrowthRates();
    }, growthMetricsIntervalMs);

    this.registerShutdownHandlers();
  }

  public stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.growthTimer) {
      clearInterval(this.growthTimer);
      this.growthTimer = null;
    }
  }

  /**
   * Forces immediate flush of all dirty records.
   */
  public async flushAllToFirestore(): Promise<void> {
    await this.flushDirtyToFirestore();
  }

  /**
   * Registers process exit / crash safety handlers to flush remaining dirty data.
   */
  public registerShutdownHandlers(): void {
    if (this.shutdownRegistered) return;
    this.shutdownRegistered = true;

    const onExitHandler = async (signal: string) => {
      console.log(`[CheerService] Process ${signal} received. Flushing dirty cheer state to Firestore...`);
      try {
        await this.flushAllToFirestore();
      } catch (err) {
        console.error('[CheerService] Shutdown flush error:', err);
      }
    };

    process.once('SIGTERM', () => onExitHandler('SIGTERM'));
    process.once('SIGINT', () => onExitHandler('SIGINT'));
    process.once('beforeExit', () => onExitHandler('beforeExit'));

    process.on('uncaughtException', async (err) => {
      console.error('[CheerService] Uncaught exception encountered:', err);
      try {
        await this.flushAllToFirestore();
      } catch (_) {}
    });

    process.on('unhandledRejection', async (reason) => {
      console.error('[CheerService] Unhandled promise rejection:', reason);
      try {
        await this.flushAllToFirestore();
      } catch (_) {}
    });
  }
}
