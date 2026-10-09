export interface ServerHealthInfo {
  status: string;
  connections: number;
  timestamp: string;
  isOnline: boolean;
}

/**
 * Fetches server health status and active WebSocket connection count from /api/health endpoint.
 */
export async function fetchServerHealth(): Promise<ServerHealthInfo> {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      status: data.status || 'ok',
      connections: typeof data.connections === 'number' ? data.connections : 0,
      timestamp: data.timestamp || new Date().toISOString(),
      isOnline: true
    };
  } catch (error) {
    console.warn('[ServerHealthService] Failed to fetch server health:', error);
    return {
      status: 'offline',
      connections: 0,
      timestamp: new Date().toISOString(),
      isOnline: false
    };
  }
}
