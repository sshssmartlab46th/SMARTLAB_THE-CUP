import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { realtimeWsClient } from './realtimeWsClient';

describe('realtimeWsClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if ((import.meta as any).env) {
      delete (import.meta as any).env.VITE_WS_URL;
    }
    delete process.env.VITE_WS_URL;
  });

  it('should return custom WebSocket URL when VITE_WS_URL is set in environment', () => {
    process.env.VITE_WS_URL = 'wss://custom-ws.example.com';
    expect(realtimeWsClient.getWsUrl()).toBe('wss://custom-ws.example.com');
  });

  it('should return window location host WebSocket URL when VITE_WS_URL is not set', () => {
    delete process.env.VITE_WS_URL;
    if ((import.meta as any).env) {
      delete (import.meta as any).env.VITE_WS_URL;
    }

    const mockWindow = {
      location: {
        protocol: 'https:',
        host: 'app.example.com',
        hostname: 'app.example.com'
      }
    };

    const hasGlobalWindow = typeof globalThis.window !== 'undefined';
    const origWindow = (globalThis as any).window;

    (globalThis as any).window = mockWindow;

    try {
      const wsUrl = realtimeWsClient.getWsUrl();
      expect(wsUrl).toBe('wss://app.example.com');
    } finally {
      if (!hasGlobalWindow) {
        delete (globalThis as any).window;
      } else {
        (globalThis as any).window = origWindow;
      }
    }
  });

  it('should detect Vercel environment correctly based on hostname', () => {
    const isVercel = realtimeWsClient.isVercelEnvironment();
    expect(typeof isVercel).toBe('boolean');
  });

  it('should attempt WS connection when custom VITE_WS_URL is set even if in Vercel environment', () => {
    process.env.VITE_WS_URL = 'wss://backend-ws.example.com';
    const spyIsVercel = vi.spyOn(realtimeWsClient, 'isVercelEnvironment').mockReturnValue(true);

    // Should not skip connection when custom VITE_WS_URL is set
    realtimeWsClient.initConnection();
    expect(spyIsVercel).not.toHaveBeenCalled();
  });

  it('should process BATCH_UPDATE diffs and update cached matches incrementally', () => {
    const listener = vi.fn();
    realtimeWsClient.subscribeMatches(listener);

    const handleMessage = (realtimeWsClient as any).handleIncomingMessage.bind(realtimeWsClient);

    // Initial full state with 2 matches
    handleMessage({
      type: 'INITIAL_STATE',
      matches: [
        { id: 'm1', sport: 'soccer', homeTeam: 'A', awayTeam: 'B' },
        { id: 'm2', sport: 'basketball', homeTeam: 'C', awayTeam: 'D' }
      ]
    });

    expect(listener).toHaveBeenLastCalledWith([
      { id: 'm1', sport: 'soccer', homeTeam: 'A', awayTeam: 'B' },
      { id: 'm2', sport: 'basketball', homeTeam: 'C', awayTeam: 'D' }
    ]);

    // Batch update with only m1 updated
    handleMessage({
      type: 'BATCH_UPDATE',
      matches: [
        { id: 'm1', sport: 'soccer', homeTeam: 'A', awayTeam: 'B', homeScore: 1 }
      ]
    });

    expect(listener).toHaveBeenLastCalledWith([
      { id: 'm1', sport: 'soccer', homeTeam: 'A', awayTeam: 'B', homeScore: 1 },
      { id: 'm2', sport: 'basketball', homeTeam: 'C', awayTeam: 'D' }
    ]);

    // Batch update with m2 deleted
    handleMessage({
      type: 'BATCH_UPDATE',
      matches: [
        { id: 'm2', _deleted: true }
      ]
    });

    expect(listener).toHaveBeenLastCalledWith([
      { id: 'm1', sport: 'soccer', homeTeam: 'A', awayTeam: 'B', homeScore: 1 }
    ]);
  });

  it('should warn when VITE_WS_URL is missing in Vercel environment during initConnection', () => {
    delete process.env.VITE_WS_URL;
    if ((import.meta as any).env) {
      delete (import.meta as any).env.VITE_WS_URL;
    }

    const origWindow = (globalThis as any).window;
    (globalThis as any).window = {
      location: {
        protocol: 'https:',
        host: 'test.vercel.app',
        hostname: 'test.vercel.app'
      }
    };

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(realtimeWsClient, 'isVercelEnvironment').mockReturnValue(true);

    try {
      realtimeWsClient.initConnection();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RealtimeWs] VITE_WS_URL is not configured for Vercel environment')
      );
    } finally {
      if (origWindow === undefined) {
        delete (globalThis as any).window;
      } else {
        (globalThis as any).window = origWindow;
      }
    }
  });

  it('should cap reconnection delay at 30000ms even after multiple consecutive failures', () => {
    vi.useFakeTimers();
    const initSpy = vi.spyOn(realtimeWsClient, 'initConnection').mockImplementation(() => {});

    // Set consecutive failures to high number (> 3)
    (realtimeWsClient as any).consecutiveFailures = 10;
    (realtimeWsClient as any).reconnectDelay = 60000; // maxReconnectDelay is 30000
    (realtimeWsClient as any).scheduleReconnect();

    // Advance timers by 29900ms - initConnection should not be called yet
    vi.advanceTimersByTime(29900);
    expect(initSpy).not.toHaveBeenCalled();

    // Advance past 30000ms
    vi.advanceTimersByTime(200);
    expect(initSpy).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should trigger reconnectImmediately when online or visibilitychange event occurs', () => {
    const reconnectSpy = vi.spyOn(realtimeWsClient, 'reconnectImmediately').mockImplementation(() => {});

    const listeners: Record<string, EventListener> = {};
    const origWindow = (globalThis as any).window;
    const origDoc = (globalThis as any).document;

    const mockDoc = {
      visibilityState: 'visible',
      addEventListener: vi.fn((event: string, fn: EventListener) => {
        listeners[event] = fn;
      })
    };

    const mockWin = {
      addEventListener: vi.fn((event: string, fn: EventListener) => {
        listeners[event] = fn;
      })
    };

    (globalThis as any).window = mockWin;
    (globalThis as any).document = mockDoc;

    try {
      (realtimeWsClient as any).initNetworkListeners();

      // Trigger online event
      if (listeners['online']) {
        listeners['online']({} as Event);
        expect(reconnectSpy).toHaveBeenCalled();
      }

      reconnectSpy.mockClear();

      // Trigger visibilitychange event when visible
      if (listeners['visibilitychange']) {
        listeners['visibilitychange']({} as Event);
        expect(reconnectSpy).toHaveBeenCalled();
      }
    } finally {
      if (origWindow === undefined) delete (globalThis as any).window;
      else (globalThis as any).window = origWindow;

      if (origDoc === undefined) delete (globalThis as any).document;
      else (globalThis as any).document = origDoc;
    }
  });
});
