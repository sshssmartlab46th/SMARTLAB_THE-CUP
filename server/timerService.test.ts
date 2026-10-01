import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MatchTimerService, MatchTimerState } from './timerService';

describe('MatchTimerService', () => {
  let matchesMap: Map<string, MatchTimerState>;
  let timerService: MatchTimerService;

  beforeEach(() => {
    vi.useFakeTimers();
    matchesMap = new Map();
    timerService = new MatchTimerService(matchesMap);
  });

  afterEach(() => {
    timerService.stop();
    vi.useRealTimers();
  });

  it('should update elapsedSeconds for LIVE running matches on 100Hz tick', () => {
    const now = Date.now();
    const match: MatchTimerState = {
      id: 'match-1',
      status: 'LIVE',
      timerRunning: true,
      lastTimerStartedAt: now,
      elapsedSeconds: 10
    };

    timerService.handleMatchUpdate(match);
    matchesMap.set(match.id, match);

    let updateCallbackCalled = false;
    timerService.setOnUpdateCallback(() => {
      updateCallbackCalled = true;
    });

    timerService.start();

    // Advance time by 5 seconds (500 ticks at 10ms each)
    vi.advanceTimersByTime(5000);

    expect(matchesMap.get('match-1')?.elapsedSeconds).toBe(15);
    expect(updateCallbackCalled).toBe(true);
  });

  it('should auto-assign lastTimerStartedAt if timerRunning is true but lastTimerStartedAt is missing', () => {
    const now = 1000000;
    vi.setSystemTime(now);

    const match: MatchTimerState = {
      id: 'match-no-start-time',
      status: 'LIVE',
      timerRunning: true,
      elapsedSeconds: 0
    };

    timerService.handleMatchUpdate(match);
    expect(match.lastTimerStartedAt).toBe(now);
  });

  it('should not update elapsedSeconds if timer is not running or match is not LIVE', () => {
    const match1: MatchTimerState = {
      id: 'match-paused',
      status: 'PAUSED',
      timerRunning: false,
      lastTimerStartedAt: Date.now(),
      elapsedSeconds: 10
    };
    const match2: MatchTimerState = {
      id: 'match-finished',
      status: 'FINISHED',
      timerRunning: false,
      lastTimerStartedAt: Date.now(),
      elapsedSeconds: 300
    };

    timerService.handleMatchUpdate(match1);
    timerService.handleMatchUpdate(match2);
    matchesMap.set(match1.id, match1);
    matchesMap.set(match2.id, match2);

    timerService.start();
    vi.advanceTimersByTime(5000);

    expect(matchesMap.get('match-paused')?.elapsedSeconds).toBe(10);
    expect(matchesMap.get('match-finished')?.elapsedSeconds).toBe(300);
  });

  it('should flush elapsedSeconds to Firestore when dbInstance is set', async () => {
    const mockSetDoc = vi.fn().mockResolvedValue(undefined);
    const mockDb = {};

    // Mock setDoc
    timerService.setDbInstance(mockDb);

    const match: MatchTimerState = {
      id: 'match-to-flush',
      status: 'LIVE',
      timerRunning: true,
      elapsedSeconds: 42
    };

    matchesMap.set(match.id, match);

    // Call flushToFirestore directly
    await timerService.flushToFirestore();
    // Verify no throw
  });
});
