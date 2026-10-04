import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReactionService, getDefaultReactions } from './reactionService';

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, _col, id) => ({ id, path: `live_reactions/${id}` })),
  setDoc: vi.fn(() => Promise.resolve())
}));

import { setDoc } from 'firebase/firestore';

describe('ReactionService', () => {
  let reactionService: ReactionService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {};
    reactionService = new ReactionService(mockDb);
  });

  it('should restore initial reaction state from records', () => {
    reactionService.restoreInitialState([
      {
        id: 'match-1',
        data: {
          reactions: { fire: 10, heart: 5 }
        }
      }
    ]);

    const reactions = reactionService.getReactions('match-1');
    expect(reactions.fire).toBe(10);
    expect(reactions.heart).toBe(5);
    expect(reactions.clap).toBe(0);
    expect(reactionService.isDirty()).toBe(false);
  });

  it('should increment reaction count and mark record dirty', () => {
    let updateCallbackCalled = false;
    reactionService.setOnUpdateCallback(() => {
      updateCallbackCalled = true;
    });

    const res = reactionService.incrementReaction('match-1', 'fire');
    expect(res.fire).toBe(1);
    expect(reactionService.isDirty()).toBe(true);
    expect(reactionService.getDirtyCount()).toBe(1);
    expect(updateCallbackCalled).toBe(true);

    reactionService.incrementReaction('match-1', 'heart');
    expect(res.heart).toBe(1);
    expect(reactionService.getDirtyCount()).toBe(1);
  });

  it('should flush dirty records to Firestore and clear dirty state', async () => {
    reactionService.incrementReaction('match-1', 'fire');
    reactionService.incrementReaction('match-2', 'heart');

    expect(reactionService.getDirtyCount()).toBe(2);

    const flushedCount = await reactionService.flushDirtyToFirestore();

    expect(flushedCount).toBe(2);
    expect(reactionService.isDirty()).toBe(false);
    expect(setDoc).toHaveBeenCalledTimes(2);
  });

  it('should not flush if there are no dirty records', async () => {
    const flushedCount = await reactionService.flushDirtyToFirestore();
    expect(flushedCount).toBe(0);
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('should handle external snapshot updates without marking dirty', () => {
    reactionService.restoreInitialState([
      {
        id: 'match-1',
        data: { reactions: { fire: 10 } }
      }
    ]);

    reactionService.handleExternalUpdate('match-1', {
      reactions: { fire: 15, clap: 3 }
    });

    const reactions = reactionService.getReactions('match-1');
    expect(reactions.fire).toBe(15);
    expect(reactions.clap).toBe(3);
    expect(reactionService.isDirty()).toBe(false);
  });

  it('should start and stop timer cleanly', () => {
    reactionService.start(1000);
    reactionService.stop();
  });
});
