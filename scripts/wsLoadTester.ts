import { WebSocket } from 'ws';
import { LoadTestConfig, getLoadTestConfig, generateClientActionPayload } from './wsLoadTestConfig';

export interface LoadTestStats {
  connectedClients: number;
  activeClients: number;
  failedConnections: number;
  disconnectedClients: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  totalErrors: number;
  pingCount: number;
  pongCount: number;
  batchUpdateCount: number;
  latencySamples: number[];
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  startTime: number;
  endTime?: number;
}

export function calculateLatencyPercentiles(samples: number[]): {
  avg: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
} {
  if (samples.length === 0) {
    return { avg: 0, p95: 0, p99: 0, min: 0, max: 0 };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avg = Math.round(sum / sorted.length);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const p95Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  const p99Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99));

  return {
    avg,
    p95: sorted[p95Idx],
    p99: sorted[p99Idx],
    min,
    max
  };
}

export class WsLoadTester {
  private config: LoadTestConfig;
  private sockets: Map<number, WebSocket> = new Map();
  private timers: Map<number, NodeJS.Timeout[]> = new Map();
  private stats: LoadTestStats;
  private pingTimestamps: Map<number, number> = new Map();

  constructor(customConfig?: Partial<LoadTestConfig>) {
    this.config = getLoadTestConfig(customConfig);
    this.stats = {
      connectedClients: 0,
      activeClients: 0,
      failedConnections: 0,
      disconnectedClients: 0,
      totalMessagesSent: 0,
      totalMessagesReceived: 0,
      totalErrors: 0,
      pingCount: 0,
      pongCount: 0,
      batchUpdateCount: 0,
      latencySamples: [],
      avgLatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      minLatencyMs: 0,
      maxLatencyMs: 0,
      startTime: Date.now()
    };
  }

  public getStats(): LoadTestStats {
    const latencies = calculateLatencyPercentiles(this.stats.latencySamples);
    return {
      ...this.stats,
      avgLatencyMs: latencies.avg,
      p95LatencyMs: latencies.p95,
      p99LatencyMs: latencies.p99,
      minLatencyMs: latencies.min,
      maxLatencyMs: latencies.max
    };
  }

  public async run(): Promise<LoadTestStats> {
    this.stats.startTime = Date.now();
    const { totalConnections, rampUpBatchSize, rampUpIntervalMs, testDurationMs } = this.config;

    console.log(`[WsLoadTester] Target: ${this.config.targetUrl}`);
    console.log(`[WsLoadTester] Connecting ${totalConnections} clients (Batch size: ${rampUpBatchSize}, Interval: ${rampUpIntervalMs}ms)...`);

    let connectedCount = 0;
    while (connectedCount < totalConnections) {
      const currentBatchSize = Math.min(rampUpBatchSize, totalConnections - connectedCount);
      const batchPromises: Promise<void>[] = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const clientId = connectedCount + i + 1;
        batchPromises.push(this.connectClient(clientId));
      }

      await Promise.all(batchPromises);
      connectedCount += currentBatchSize;

      if (connectedCount < totalConnections && rampUpIntervalMs > 0) {
        await new Promise((res) => setTimeout(res, rampUpIntervalMs));
      }
    }

    console.log(`[WsLoadTester] All ${totalConnections} client connection attempts completed. Active: ${this.stats.activeClients}`);

    if (testDurationMs > 0) {
      console.log(`[WsLoadTester] Maintaining load for ${testDurationMs / 1000} seconds...`);
      await new Promise((res) => setTimeout(res, testDurationMs));
    }

    this.stopAll();
    this.stats.endTime = Date.now();
    return this.getStats();
  }

  public connectClient(clientId: number): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(this.config.targetUrl);
        const clientTimers: NodeJS.Timeout[] = [];

        ws.on('open', () => {
          this.stats.connectedClients++;
          this.stats.activeClients++;
          this.sockets.set(clientId, ws);

          if (this.config.enableActions) {
            // Heartbeat ping interval
            const pingTimer = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                const now = Date.now();
                this.pingTimestamps.set(clientId, now);
                const pingMsg = generateClientActionPayload(clientId, this.config.matchIds, 'ping');
                ws.send(JSON.stringify(pingMsg));
                this.stats.pingCount++;
                this.stats.totalMessagesSent++;
              }
            }, this.config.pingIntervalMs);

            // Action activity (cheer / reaction / sync)
            const actionTimer = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                const actionMsg = generateClientActionPayload(clientId, this.config.matchIds);
                ws.send(JSON.stringify(actionMsg));
                this.stats.totalMessagesSent++;
              }
            }, this.config.actionIntervalMs + (clientId % 1000));

            clientTimers.push(pingTimer, actionTimer);
          }

          this.timers.set(clientId, clientTimers);
          resolve();
        });

        ws.on('message', (data: any) => {
          this.stats.totalMessagesReceived++;
          try {
            const parsed = JSON.parse(data.toString());
            if (parsed.type === 'pong') {
              this.stats.pongCount++;
              const sentTimestamp = this.pingTimestamps.get(clientId);
              if (sentTimestamp) {
                const latency = Date.now() - sentTimestamp;
                this.stats.latencySamples.push(latency);
                this.pingTimestamps.delete(clientId);
              }
            } else if (parsed.type === 'BATCH_UPDATE') {
              this.stats.batchUpdateCount++;
            }
          } catch (e) {
            // Unparseable frame ignore
          }
        });

        ws.on('error', () => {
          this.stats.totalErrors++;
          if (!this.sockets.has(clientId)) {
            this.stats.failedConnections++;
            resolve();
          }
        });

        ws.on('close', () => {
          if (this.sockets.has(clientId)) {
            this.stats.activeClients--;
            this.stats.disconnectedClients++;
            this.sockets.delete(clientId);
            this.clearClientTimers(clientId);
          }
        });
      } catch (err) {
        this.stats.failedConnections++;
        this.stats.totalErrors++;
        resolve();
      }
    });
  }

  private clearClientTimers(clientId: number) {
    const list = this.timers.get(clientId);
    if (list) {
      list.forEach((t) => clearInterval(t));
      this.timers.delete(clientId);
    }
  }

  public stopAll() {
    this.timers.forEach((list) => list.forEach((t) => clearInterval(t)));
    this.timers.clear();

    this.sockets.forEach((ws) => {
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      } catch (e) {
        // ignore close errors
      }
    });

    this.sockets.clear();
    this.stats.activeClients = 0;
  }
}
