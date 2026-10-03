import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CheerService } from './cheerService';

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, _col, id) => ({ id, path: `cheers/${id}` })),
  setDoc: vi.fn(() => Promise.resolve())
}));

import { setDoc } from 'firebase/firestore';

describe('CheerService', () => {
  let cheerService: CheerService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {};
    cheerService = new CheerService(mockDb);
  });

  it('should restore initial state from records', () => {
    cheerService.restoreInitialState([
      {
        id: 'match-1',
        data: {
          matchId: 'match-1',
          homeCheers: 10,
          awayCheers: 5,
          lastEmoji: '🔥',
          fiveMinIncrement: 0,
          fiveMinGrowthRate: 0
        }
      }
    ]);

    const cheer = cheerService.getCheer('match-1');
    expect(cheer).toBeDefined();
    expect(cheer?.homeCheers).toBe(10);
    expect(cheer?.awayCheers).toBe(5);
    expect(cheerService.isDirty()).toBe(false);
  });

  it('should increment cheer counts and mark record dirty', () => {
    let updateCallbackCalled = false;
    cheerService.setOnUpdateCallback(() => {
      updateCallbackCalled = true;
    });

    const cheer1 = cheerService.incrementCheer('match-1', 'home', '👏');
    expect(cheer1.homeCheers).toBe(1);
    expect(cheer1.awayCheers).toBe(0);
    expect(cheer1.lastEmoji).toBe('👏');
    expect(cheerService.isDirty()).toBe(true);
    expect(cheerService.getDirtyCount()).toBe(1);
    expect(updateCallbackCalled).toBe(true);

    cheerService.incrementCheer('match-1', 'away', '🎉');
    expect(cheer1.homeCheers).toBe(1);
    expect(cheer1.awayCheers).toBe(1);
    expect(cheer1.lastEmoji).toBe('🎉');
    expect(cheerService.getDirtyCount()).toBe(1);
  });

  it('should flush dirty records to Firestore and clear dirty state', async () => {
    cheerService.incrementCheer('match-1', 'home', '🔥');
    cheerService.incrementCheer('match-2', 'away', '⚽');

    expect(cheerService.getDirtyCount()).toBe(2);

    const flushedCount = await cheerService.flushDirtyToFirestore();

    expect(flushedCount).toBe(2);
    expect(cheerService.isDirty()).toBe(false);
    expect(setDoc).toHaveBeenCalledTimes(2);
  });

  it('should not flush if there are no dirty records', async () => {
    const flushedCount = await cheerService.flushDirtyToFirestore();
    expect(flushedCount).toBe(0);
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('should handle external snapshot updates without marking dirty if no change or smaller', () => {
    cheerService.restoreInitialState([
      {
        id: 'match-1',
        data: { matchId: 'match-1', homeCheers: 10, awayCheers: 10 }
      }
    ]);

    cheerService.handleExternalUpdate('match-1', {
      matchId: 'match-1',
      homeCheers: 15,
      awayCheers: 10,
      lastEmoji: '🔥'
    });

    const cheer = cheerService.getCheer('match-1');
    expect(cheer?.homeCheers).toBe(15);
    // External update should update in-memory state without re-marking dirty
    expect(cheerService.isDirty()).toBe(false);
  });

  it('should update 5-minute growth rates and flush', async () => {
    cheerService.restoreInitialState([
      {
        id: 'match-1',
        data: { matchId: 'match-1', homeCheers: 10, awayCheers: 10 }
      }
    ]);

    cheerService.incrementCheer('match-1', 'home', '🔥'); // home: 11, away: 10, total: 21 (prev was 20)
    cheerService.incrementCheer('match-1', 'home', '🔥'); // home: 12, away: 10, total: 22

    await cheerService.updateFiveMinGrowthRates();

    const cheer = cheerService.getCheer('match-1');
    expect(cheer?.fiveMinIncrement).toBe(2); // 22 - 20 = 2
    expect(cheer?.fiveMinGrowthRate).toBe(10); // (2 / 20) * 100 = 10%
    expect(setDoc).toHaveBeenCalled();
  });

  it('should start and stop timer cleanly', () => {
    cheerService.start(1000, 5000);
    cheerService.stop();
  });
});
