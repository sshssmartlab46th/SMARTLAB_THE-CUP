import { describe, it, expect, vi } from 'vitest';
import { realtimeWsClient } from './realtimeWsClient';
import { LiveReactionType } from '../types';

describe('Per-Match Live Reactions', () => {
  it('should initialize default zero counters for a new match ID', () => {
    let receivedReactions: Record<LiveReactionType, number> | null = null;
    const matchId = 'test-match-init-01';

    const unsub = realtimeWsClient.subscribeReactions(matchId, (reactions) => {
      receivedReactions = reactions;
    });

    expect(receivedReactions).not.toBeNull();
    expect(receivedReactions).toEqual({
      fire: 0,
      clap: 0,
      heart: 0,
      cheer: 0,
      trophy: 0,
      sparkles: 0,
      star: 0
    });

    unsub();
  });

  it('should optimistically increment reaction count specifically for target matchId', () => {
    const matchA = 'test-match-A';
    const matchB = 'test-match-B';

    let reactionsA: Record<LiveReactionType, number> | null = null;
    let reactionsB: Record<LiveReactionType, number> | null = null;

    const unsubA = realtimeWsClient.subscribeReactions(matchA, (r) => { reactionsA = r; });
    const unsubB = realtimeWsClient.subscribeReactions(matchB, (r) => { reactionsB = r; });

    // Send 'fire' to Match A
    realtimeWsClient.sendReaction(matchA, 'fire');

    expect(reactionsA?.fire).toBe(1);
    expect(reactionsA?.heart).toBe(0);

    // Match B should remain unchanged
    expect(reactionsB?.fire).toBe(0);

    // Send 'heart' twice to Match B
    realtimeWsClient.sendReaction(matchB, 'heart');
    realtimeWsClient.sendReaction(matchB, 'heart');

    expect(reactionsB?.heart).toBe(2);
    expect(reactionsB?.fire).toBe(0);

    // Match A's 'fire' should still be 1
    expect(reactionsA?.fire).toBe(1);

    unsubA();
    unsubB();
  });
});
