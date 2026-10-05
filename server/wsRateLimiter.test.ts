import { describe, it, expect } from 'vitest';
import { WsRateLimiter } from './wsRateLimiter';

describe('WsRateLimiter', () => {
  it('allows messages within rate limit', () => {
    const limiter = new WsRateLimiter({ maxMessagesPerWindow: 5, windowMs: 1000 });
    const clientKey = 'client-1';

    for (let i = 0; i < 5; i++) {
      expect(limiter.consume(clientKey)).toBe(true);
    }
  });

  it('rejects messages exceeding rate limit', () => {
    const limiter = new WsRateLimiter({ maxMessagesPerWindow: 3, windowMs: 1000 });
    const clientKey = 'client-1';
    const now = 10000;

    expect(limiter.consume(clientKey, now)).toBe(true);
    expect(limiter.consume(clientKey, now + 100)).toBe(true);
    expect(limiter.consume(clientKey, now + 200)).toBe(true);

    // 4th message within same 1 sec window should be rejected
    expect(limiter.consume(clientKey, now + 300)).toBe(false);
  });

  it('allows new messages after window slides past old messages', () => {
    const limiter = new WsRateLimiter({ maxMessagesPerWindow: 2, windowMs: 1000 });
    const clientKey = 'client-1';
    const startTime = 10000;

    expect(limiter.consume(clientKey, startTime)).toBe(true);
    expect(limiter.consume(clientKey, startTime + 100)).toBe(true);
    expect(limiter.consume(clientKey, startTime + 200)).toBe(false);

    // After windowMs passes (1001 ms later)
    expect(limiter.consume(clientKey, startTime + 1100)).toBe(true);
  });

  it('tracks connections independently', () => {
    const limiter = new WsRateLimiter({ maxMessagesPerWindow: 2, windowMs: 1000 });
    const clientA = 'client-A';
    const clientB = 'client-B';
    const now = 10000;

    expect(limiter.consume(clientA, now)).toBe(true);
    expect(limiter.consume(clientA, now)).toBe(true);
    expect(limiter.consume(clientA, now)).toBe(false);

    // Client B should still be allowed
    expect(limiter.consume(clientB, now)).toBe(true);
    expect(limiter.consume(clientB, now)).toBe(true);
  });

  it('cleans up connection state when client disconnects', () => {
    const limiter = new WsRateLimiter({ maxMessagesPerWindow: 5, windowMs: 1000 });
    const client = 'client-disconnect';

    limiter.consume(client);
    expect(limiter.trackedConnectionsCount).toBe(1);

    limiter.cleanup(client);
    expect(limiter.trackedConnectionsCount).toBe(0);
  });
});
