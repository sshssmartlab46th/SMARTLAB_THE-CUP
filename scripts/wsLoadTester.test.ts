import { describe, it, expect } from 'vitest';
import { getLoadTestConfig, generateClientActionPayload } from './wsLoadTestConfig';
import { calculateLatencyPercentiles } from './wsLoadTester';
import { parseCliArgs } from './wsLoadTestRunner';

describe('WebSocket Load Test Suite Helpers', () => {
  describe('getLoadTestConfig', () => {
    it('returns default config with fallback URL when no process env is defined', () => {
      const config = getLoadTestConfig();
      expect(config.totalConnections).toBe(1000);
      expect(config.rampUpBatchSize).toBe(50);
      expect(config.testDurationMs).toBe(30000);
      expect(config.targetUrl).toMatch(/^ws:\/\//);
    });

    it('applies overrides correctly', () => {
      const config = getLoadTestConfig({
        totalConnections: 500,
        targetUrl: 'ws://custom-server:8080',
        enableActions: false
      });
      expect(config.totalConnections).toBe(500);
      expect(config.targetUrl).toBe('ws://custom-server:8080');
      expect(config.enableActions).toBe(false);
    });
  });

  describe('generateClientActionPayload', () => {
    it('generates a valid ping payload', () => {
      const payload = generateClientActionPayload(1, ['match-1'], 'ping');
      expect(payload.action).toBe('ping');
      expect(payload.clientId).toBe(1);
      expect(typeof payload.timestamp).toBe('number');
    });

    it('generates a valid cheer payload with match selection', () => {
      const payload = generateClientActionPayload(2, ['match-101', 'match-102'], 'cheer');
      expect(payload.action).toBe('cheer');
      expect(payload.clientId).toBe(2);
      expect(['match-101', 'match-102']).toContain(payload.matchId);
      expect(['home', 'away']).toContain(payload.team);
      expect(payload.emoji).toBeTruthy();
    });

    it('generates a valid reaction payload', () => {
      const payload = generateClientActionPayload(3, ['match-200'], 'reaction');
      expect(payload.action).toBe('reaction');
      expect(payload.matchId).toBe('match-200');
      expect(payload.reactionType).toBeTruthy();
    });
  });

  describe('calculateLatencyPercentiles', () => {
    it('handles empty sample array safely', () => {
      const result = calculateLatencyPercentiles([]);
      expect(result).toEqual({ avg: 0, p95: 0, p99: 0, min: 0, max: 0 });
    });

    it('calculates average, min, max, p95, p99 correctly', () => {
      const samples = Array.from({ length: 100 }, (_, i) => i + 1); // 1 to 100
      const result = calculateLatencyPercentiles(samples);

      expect(result.min).toBe(1);
      expect(result.max).toBe(100);
      expect(result.avg).toBe(51); // sum 5050 / 100
      expect(result.p95).toBe(96);
      expect(result.p99).toBe(100);
    });
  });

  describe('parseCliArgs', () => {
    it('parses --connections, --duration, --url flags', () => {
      const args = ['--connections', '200', '--duration', '10', '--url', 'ws://127.0.0.1:4000'];
      const parsed = parseCliArgs(args);

      expect(parsed.totalConnections).toBe(200);
      expect(parsed.testDurationMs).toBe(10000);
      expect(parsed.targetUrl).toBe('ws://127.0.0.1:4000');
    });
  });
});
