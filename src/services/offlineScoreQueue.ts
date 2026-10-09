import { realtimeWsClient } from './realtimeWsClient';

export type ScoreActionType =
  | 'QUICK_ADJUST'
  | 'SCORE_UPDATE'
  | 'RECORD_GOAL'
  | 'REMOVE_EVENT'
  | 'SUBMIT_SCORE_APPROVAL';

export interface QueuedScoreAction {
  id: string;
  type: ScoreActionType;
  payload: any;
  timestamp: string;
  retryCount?: number;
}

export interface OfflineQueueState {
  isOnline: boolean;
  isFlushing: boolean;
  queue: QueuedScoreAction[];
  lastSyncedAt: string | null;
}

const STORAGE_KEY = 'the_sangsan_referee_offline_queue';

type ScoreExecutor = (action: QueuedScoreAction) => Promise<void>;
type QueueStateListener = (state: OfflineQueueState) => void;

class OfflineScoreQueueManager {
  private queue: QueuedScoreAction[] = [];
  private isFlushing = false;
  private executor: ScoreExecutor | null = null;
  private listeners: Set<QueueStateListener> = new Set();
  private lastSyncedAt: string | null = null;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    this.loadFromStorage();
    this.initNetworkListeners();
  }

  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
        }
      }
    } catch (e) {
      console.warn('[OfflineScoreQueue] Failed to load queue from localStorage:', e);
      this.queue = [];
    }
  }

  private saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.warn('[OfflineScoreQueue] Failed to save queue to localStorage:', e);
    }
  }

  private initNetworkListeners() {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      this.isOnline = true;
      this.notifyListeners();
      this.flushQueue();
    };

    const handleOffline = () => {
      this.isOnline = false;
      this.notifyListeners();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to WebSocket status
    try {
      realtimeWsClient.subscribeStatus((connected) => {
        if (connected && !this.isOnline) {
          this.isOnline = true;
          this.notifyListeners();
          this.flushQueue();
        }
      });
    } catch {
      // Ignore if realtimeWsClient not present in tests
    }
  }

  public setExecutor(executor: ScoreExecutor) {
    this.executor = executor;
    // Attempt flushing immediately if online and queue is not empty
    if (this.isOnline && this.queue.length > 0) {
      this.flushQueue();
    }
  }

  public getState(): OfflineQueueState {
    return {
      isOnline: this.isOnline,
      isFlushing: this.isFlushing,
      queue: [...this.queue],
      lastSyncedAt: this.lastSyncedAt
    };
  }

  public subscribe(listener: QueueStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error('[OfflineScoreQueue] Error in listener callback:', e);
      }
    });
  }

  /**
   * Enqueues a score action and immediately attempts to process if online.
   * If offline or if network fails, keeps the item stored in queue.
   */
  public enqueueAction(type: ScoreActionType, payload: any): QueuedScoreAction {
    const action: QueuedScoreAction = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    this.queue.push(action);
    this.saveToStorage();
    this.notifyListeners();

    // Auto attempt flushing
    if (this.isOnline && this.executor && !this.isFlushing) {
      this.flushQueue();
    }

    return action;
  }

  /**
   * Sequentially flushes all queued items in FIFO order.
   */
  public async flushQueue(): Promise<{ processedCount: number; remainingCount: number }> {
    if (this.isFlushing || this.queue.length === 0 || !this.executor) {
      return { processedCount: 0, remainingCount: this.queue.length };
    }

    this.isFlushing = true;
    this.notifyListeners();

    let processedCount = 0;

    try {
      while (this.queue.length > 0) {
        const item = this.queue[0];
        try {
          await this.executor(item);
          // Processing succeeded -> shift from queue
          this.queue.shift();
          processedCount++;
          this.saveToStorage();
          this.lastSyncedAt = new Date().toISOString();
          this.notifyListeners();
        } catch (err) {
          console.warn(`[OfflineScoreQueue] Failed to execute action ${item.id}:`, err);
          item.retryCount = (item.retryCount || 0) + 1;
          this.saveToStorage();
          // If execution failed due to network / backend error, pause flushing until network is re-established
          break;
        }
      }
    } finally {
      this.isFlushing = false;
      this.notifyListeners();
    }

    return { processedCount, remainingCount: this.queue.length };
  }

  public clearQueue() {
    this.queue = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  public removeAction(actionId: string) {
    this.queue = this.queue.filter((a) => a.id !== actionId);
    this.saveToStorage();
    this.notifyListeners();
  }
}

export const offlineScoreQueue = new OfflineScoreQueueManager();
