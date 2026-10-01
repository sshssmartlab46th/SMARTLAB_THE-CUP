import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatElapsedSeconds, computeLiveElapsedSeconds } from './timerUtils';

describe('timerUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatElapsedSeconds', () => {
    it('formats 0 seconds as 00:00', () => {
      expect(formatElapsedSeconds(0)).toBe('00:00');
      expect(formatElapsedSeconds(null)).toBe('00:00');
      expect(formatElapsedSeconds(undefined)).toBe('00:00');
    });

    it('formats seconds correctly into MM:SS', () => {
      expect(formatElapsedSeconds(5)).toBe('00:05');
      expect(formatElapsedSeconds(65)).toBe('01:05');
      expect(formatElapsedSeconds(600)).toBe('10:00');
      expect(formatElapsedSeconds(2700)).toBe('45:00');
    });

    it('handles negative numbers safely', () => {
      expect(formatElapsedSeconds(-10)).toBe('00:00');
    });
  });

  describe('computeLiveElapsedSeconds', () => {
    it('returns 0 when match is null or undefined', () => {
      expect(computeLiveElapsedSeconds(null)).toBe(0);
      expect(computeLiveElapsedSeconds(undefined)).toBe(0);
    });

    it('returns base elapsedSeconds if timer is not running', () => {
      const match = {
        status: 'PAUSED' as const,
        timerRunning: false,
        elapsedSeconds: 120
      };
      expect(computeLiveElapsedSeconds(match)).toBe(120);
    });

    it('computes live elapsedSeconds dynamically when timer is running', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const match = {
        status: 'LIVE' as const,
        timerRunning: true,
        lastTimerStartedAt: now,
        elapsedSeconds: 30
      };

      expect(computeLiveElapsedSeconds(match)).toBe(30);

      // Advance time by 15 seconds
      vi.setSystemTime(now + 15000);

      expect(computeLiveElapsedSeconds(match)).toBe(45);
    });
  });
});
