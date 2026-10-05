export interface WsRateLimiterOptions {
  maxMessagesPerWindow?: number;
  windowMs?: number;
}

export class WsRateLimiter<TKey = any> {
  private maxMessages: number;
  private windowMs: number;
  private connectionLogs: Map<TKey, number[]> = new Map();

  constructor(options: WsRateLimiterOptions = {}) {
    this.maxMessages = options.maxMessagesPerWindow ?? 10;
    this.windowMs = options.windowMs ?? 1000;
  }

  /**
   * Checks whether the given client connection is allowed to process a new message.
   * If allowed, records the message timestamp and returns true.
   * If rate limit is exceeded, returns false.
   */
  consume(clientKey: TKey, now: number = Date.now()): boolean {
    const windowStart = now - this.windowMs;
    let timestamps = this.connectionLogs.get(clientKey) || [];

    // Filter timestamps within current window
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= this.maxMessages) {
      this.connectionLogs.set(clientKey, timestamps);
      return false;
    }

    timestamps.push(now);
    this.connectionLogs.set(clientKey, timestamps);
    return true;
  }

  /**
   * Cleans up tracking state when a client disconnects.
   */
  cleanup(clientKey: TKey): void {
    this.connectionLogs.delete(clientKey);
  }

  /**
   * Returns the count of tracked connections.
   */
  get trackedConnectionsCount(): number {
    return this.connectionLogs.size;
  }
}
