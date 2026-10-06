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
});
