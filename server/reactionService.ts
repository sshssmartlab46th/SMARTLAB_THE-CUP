import { doc, setDoc } from 'firebase/firestore';

export interface LiveReactionsMap {
  fire: number;
  clap: number;
  heart: number;
  cheer: number;
  trophy: number;
  sparkles: number;
  star: number;
}

export type LiveReactionType = keyof LiveReactionsMap;

export function getDefaultReactions(): LiveReactionsMap {
  return {
    fire: 0,
    clap: 0,
    heart: 0,
    cheer: 0,
    trophy: 0,
    sparkles: 0,
    star: 0
  };
}

export class ReactionService {
  private currentReactions = new Map<string, LiveReactionsMap>();
  private dirtyMatches = new Set<string>();
  private dbInstance: any = null;
  private flushTimer: NodeJS.Timeout | null = null;
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
   * Restores initial live_reactions records from Firestore.
   */
  public restoreInitialState(records: Array<{ id: string; data: any }>): void {
    for (const record of records) {
      const matchId = record.id;
      const data = record.data || {};
      const reactions = {
        ...getDefaultReactions(),
        ...(data.reactions || {})
      };

      (Object.keys(getDefaultReactions()) as LiveReactionType[]).forEach((k) => {
        if (typeof data[k] === 'number') {
          reactions[k] = data[k];
        }
      });

      this.currentReactions.set(matchId, reactions);
    }
  }

  /**
   * Updates state from external Firestore onSnapshot changes without marking dirty.
   */
  public handleExternalUpdate(matchId: string, data: any): void {
    const existing = this.currentReactions.get(matchId) || getDefaultReactions();
    const incoming = {
      ...getDefaultReactions(),
      ...(data.reactions || {})
    };

    (Object.keys(getDefaultReactions()) as LiveReactionType[]).forEach((k) => {
      if (typeof data[k] === 'number') {
        incoming[k] = data[k];
      }
    });

    let changed = false;
    (Object.keys(incoming) as LiveReactionType[]).forEach((k) => {
      if (incoming[k] > existing[k]) {
        existing[k] = incoming[k];
        changed = true;
      }
    });

    this.currentReactions.set(matchId, existing);

    if (changed && this.onUpdateCallback) {
      this.onUpdateCallback();
    }
  }

  /**
   * Increments reaction count for a specific matchId and reactionType. Marks record dirty for debounced flushing.
   */
  public incrementReaction(matchId: string, type: LiveReactionType): LiveReactionsMap {
    let reactions = this.currentReactions.get(matchId);
    if (!reactions) {
      reactions = getDefaultReactions();
      this.currentReactions.set(matchId, reactions);
    }

    if (reactions[type] !== undefined) {
      reactions[type] += 1;
    }

    this.dirtyMatches.add(matchId);

    if (this.onUpdateCallback) {
      this.onUpdateCallback();
    }

    return reactions;
  }

  public getReactions(matchId: string): LiveReactionsMap {
    return this.currentReactions.get(matchId) || getDefaultReactions();
  }

  public getReactionsMap(): Map<string, LiveReactionsMap> {
    return this.currentReactions;
  }

  public getReactionsRecord(): Record<string, LiveReactionsMap> {
    return Object.fromEntries(this.currentReactions);
  }

  public isDirty(): boolean {
    return this.dirtyMatches.size > 0;
  }

  public getDirtyCount(): number {
    return this.dirtyMatches.size;
  }

  /**
   * Flushes dirty reaction records to Firestore (e.g. every 10s).
   */
  public async flushDirtyToFirestore(): Promise<number> {
    if (!this.dbInstance || this.dirtyMatches.size === 0) {
      return 0;
    }

    const matchIdsToFlush = Array.from(this.dirtyMatches);
    this.dirtyMatches.clear();

    const now = new Date().toISOString();
    let flushedCount = 0;

    for (const matchId of matchIdsToFlush) {
      const reactions = this.currentReactions.get(matchId);
      if (!reactions) continue;

      try {
        const docRef = doc(this.dbInstance, 'live_reactions', matchId);
        await setDoc(docRef, {
          matchId,
          reactions,
          updatedAt: now
        }, { merge: true });
        flushedCount++;
      } catch (err) {
        console.error(`[ReactionService] Error saving live_reactions doc for match ${matchId}:`, err);
        this.dirtyMatches.add(matchId);
      }
    }

    return flushedCount;
  }

  /**
   * Starts periodic dirty flushing (default 10s).
   */
  public start(flushIntervalMs = 10000): void {
    this.stop();

    this.flushTimer = setInterval(() => {
      this.flushDirtyToFirestore();
    }, flushIntervalMs);

    this.registerShutdownHandlers();
  }

  public stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Forces immediate flush of all dirty reaction records.
   */
  public async flushAllToFirestore(): Promise<void> {
    await this.flushDirtyToFirestore();
  }

  /**
   * Registers process exit / crash safety handlers to flush remaining dirty reaction data.
   */
  public registerShutdownHandlers(): void {
    if (this.shutdownRegistered) return;
    this.shutdownRegistered = true;

    const onExitHandler = async (signal: string) => {
      console.log(`[ReactionService] Process ${signal} received. Flushing dirty reaction state to Firestore...`);
      try {
        await this.flushAllToFirestore();
      } catch (err) {
        console.error('[ReactionService] Shutdown flush error:', err);
      }
    };

    process.once('SIGTERM', () => onExitHandler('SIGTERM'));
    process.once('SIGINT', () => onExitHandler('SIGINT'));
    process.once('beforeExit', () => onExitHandler('beforeExit'));

    process.on('uncaughtException', async (err) => {
      console.error('[ReactionService] Uncaught exception encountered:', err);
      try {
        await this.flushAllToFirestore();
      } catch (_) {}
    });

    process.on('unhandledRejection', async (reason) => {
      console.error('[ReactionService] Unhandled promise rejection:', reason);
      try {
        await this.flushAllToFirestore();
      } catch (_) {}
    });
  }
}
