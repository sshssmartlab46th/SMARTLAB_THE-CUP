import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineScoreQueue, QueuedScoreAction } from './offlineScoreQueue';

// Mock localStorage
function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
}

describe('offlineScoreQueue', () => {
  beforeEach(() => {
    const mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    offlineScoreQueue.clearQueue();
  });

  it('enqueues score action when offline and persists to localStorage', () => {
    const action = offlineScoreQueue.enqueueAction('QUICK_ADJUST', {
      match: { id: 'm1', title: '축구 8강 1경기' },
      team: 'home',
      delta: 1,
      operator: { id: 'ref1', name: '박심판', role: 'referee' }
    });

    expect(action.id).toBeDefined();
    expect(action.type).toBe('QUICK_ADJUST');

    const state = offlineScoreQueue.getState();
    expect(state.queue.length).toBe(1);
    expect(state.queue[0].payload.team).toBe('home');

    // Check localStorage persistence
    const stored = localStorage.getItem('the_sangsan_referee_offline_queue');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.length).toBe(1);
    expect(parsed[0].type).toBe('QUICK_ADJUST');
  });

  it('flushes queued actions sequentially in FIFO order when executor is set', async () => {
    const executed: QueuedScoreAction[] = [];

    offlineScoreQueue.enqueueAction('QUICK_ADJUST', { matchId: 'm1', delta: 1 });
    offlineScoreQueue.enqueueAction('RECORD_GOAL', { matchId: 'm1', scorer: '손흥민' });
    offlineScoreQueue.enqueueAction('SCORE_UPDATE', { matchId: 'm2', score: '2:1' });

    expect(offlineScoreQueue.getState().queue.length).toBe(3);

    offlineScoreQueue.setExecutor(async (action) => {
      executed.push(action);
    });

    const result = await offlineScoreQueue.flushQueue();

    expect(result.processedCount).toBe(3);
    expect(result.remainingCount).toBe(0);
    expect(executed.length).toBe(3);
    expect(executed[0].type).toBe('QUICK_ADJUST');
    expect(executed[1].type).toBe('RECORD_GOAL');
    expect(executed[2].type).toBe('SCORE_UPDATE');

    expect(offlineScoreQueue.getState().queue.length).toBe(0);
  });

  it('handles executor errors gracefully and retains remaining items in queue', async () => {
    offlineScoreQueue.enqueueAction('QUICK_ADJUST', { matchId: 'm1', delta: 1 });
    offlineScoreQueue.enqueueAction('RECORD_GOAL', { matchId: 'm2', scorer: '이강인' });

    let calls = 0;
    offlineScoreQueue.setExecutor(async (action) => {
      calls++;
      if (action.type === 'QUICK_ADJUST') {
        throw new Error('Network connection failed');
      }
    });

    const result = await offlineScoreQueue.flushQueue();

    expect(result.processedCount).toBe(0);
    expect(result.remainingCount).toBe(2);
    expect(calls).toBe(1);

    const firstItem = offlineScoreQueue.getState().queue[0];
    expect(firstItem.retryCount).toBe(1);
  });

  it('notifies queue state listeners upon state changes', () => {
    const stateHistory: number[] = [];

    const unsubscribe = offlineScoreQueue.subscribe((state) => {
      stateHistory.push(state.queue.length);
    });

    offlineScoreQueue.enqueueAction('QUICK_ADJUST', { matchId: 'm1' });
    offlineScoreQueue.enqueueAction('RECORD_GOAL', { matchId: 'm1' });

    offlineScoreQueue.removeAction(offlineScoreQueue.getState().queue[0].id);

    unsubscribe();

    expect(stateHistory).toEqual([0, 1, 2, 1]);
  });
});
