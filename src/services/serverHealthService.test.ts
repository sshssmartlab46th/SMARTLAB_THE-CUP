import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchServerHealth } from './serverHealthService';

describe('serverHealthService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches server health status successfully', async () => {
    const mockHealthData = {
      status: 'ok',
      connections: 42,
      timestamp: '2025-05-10T12:00:00.000Z'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealthData
    });

    const result = await fetchServerHealth();

    expect(global.fetch).toHaveBeenCalledWith('/api/health');
    expect(result).toEqual({
      status: 'ok',
      connections: 42,
      timestamp: '2025-05-10T12:00:00.000Z',
      isOnline: true
    });
  });

  it('handles server error response gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });

    const result = await fetchServerHealth();

    expect(result.isOnline).toBe(false);
    expect(result.status).toBe('offline');
    expect(result.connections).toBe(0);
  });

  it('handles network failure gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    const result = await fetchServerHealth();

    expect(result.isOnline).toBe(false);
    expect(result.status).toBe('offline');
    expect(result.connections).toBe(0);
  });
});
