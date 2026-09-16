import { MatchItem, CheerCount, CheerMessageItem } from '../types';

type Listener<T> = (data: T) => void;

interface BatchMessage {
  type: 'INITIAL_STATE' | 'FULL_SYNC' | 'BATCH_UPDATE' | 'pong';
  timestamp?: number;
  matches?: MatchItem[];
  cheers?: Record<string, CheerCount>;
  cheersFeed?: CheerMessageItem[];
  reactions?: { fire: number; clap: number; heart: number; cheer: number };
}

class RealtimeWsClient {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private hasFailedOnce = false;
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private connectionAttemptStarted = false;

  // Cached state
  private cachedMatches: MatchItem[] | null = null;
  private cachedCheers = new Map<string, CheerCount>();
  private cachedCheersFeed: CheerMessageItem[] = [];
  private cachedReactions = { fire: 0, clap: 0, heart: 0, cheer: 0 };

  // Listeners
  private matchListeners = new Set<Listener<MatchItem[]>>();
  private cheerListeners = new Map<string, Set<Listener<CheerCount>>>();
  private cheerFeedListeners = new Set<Listener<CheerMessageItem[]>>();
  private statusListeners = new Set<Listener<boolean>>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initConnection();
    }
  }

  public isWsActive(): boolean {
    return this.isConnected;
  }

  public hasFallback(): boolean {
    return this.hasFailedOnce && !this.isConnected;
  }

  public subscribeStatus(listener: Listener<boolean>): () => void {
    this.statusListeners.add(listener);
    listener(this.isConnected);
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus(connected: boolean) {
    this.isConnected = connected;
    this.statusListeners.forEach((l) => l(connected));
  }

  private isVercelEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return hostname.includes('vercel.app');
  }

  public initConnection() {
    if (typeof window === 'undefined') return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Skip WS connection immediately on Vercel deployment without custom realtime server
    if (this.isVercelEnvironment()) {
      console.log('[RealtimeWs] Vercel environment detected. Direct Firestore fallback active.');
      this.hasFailedOnce = true;
      this.notifyStatus(false);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    try {
      this.socket = new WebSocket(wsUrl);

      // Connection timeout fallback (e.g. if server doesn't support WS)
      const connectTimeout = setTimeout(() => {
        if (!this.isConnected && this.socket?.readyState !== WebSocket.OPEN) {
          console.warn('[RealtimeWs] Connection timeout. Triggering Firestore fallback...');
          this.hasFailedOnce = true;
          this.notifyStatus(false);
        }
      }, 3500);

      this.socket.onopen = () => {
        clearTimeout(connectTimeout);
        console.log('[RealtimeWs] Connected to relay server:', wsUrl);
        this.notifyStatus(true);
        this.reconnectDelay = 1000; // Reset exponential backoff

        // Request full state synchronization
        this.send({ action: 'sync' });

        // Start ping keep-alive
        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.send({ action: 'ping' });
          }
        }, 25000);
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as BatchMessage;
          this.handleIncomingMessage(msg);
        } catch (err) {
          console.warn('[RealtimeWs] JSON parse error:', err);
        }
      };

      this.socket.onclose = () => {
        clearInterval(this.pingInterval);
        this.notifyStatus(false);
        this.hasFailedOnce = true;
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.warn('[RealtimeWs] Socket error, falling back if disconnected:', err);
        this.hasFailedOnce = true;
        this.notifyStatus(false);
      };
    } catch (e) {
      console.warn('[RealtimeWs] Initialization error:', e);
      this.hasFailedOnce = true;
      this.notifyStatus(false);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimeout);
    console.log(`[RealtimeWs] Scheduling reconnect in ${this.reconnectDelay}ms...`);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.initConnection();
    }, this.reconnectDelay);
  }

  private handleIncomingMessage(msg: BatchMessage) {
    if (msg.type === 'INITIAL_STATE' || msg.type === 'FULL_SYNC' || msg.type === 'BATCH_UPDATE') {
      // 1. Matches update
      if (Array.isArray(msg.matches)) {
        this.cachedMatches = msg.matches;
        this.matchListeners.forEach((fn) => fn(msg.matches!));
      }

      // 2. Cheers map update
      if (msg.cheers) {
        Object.entries(msg.cheers).forEach(([matchId, cheerData]) => {
          this.cachedCheers.set(matchId, cheerData);
          const listeners = this.cheerListeners.get(matchId);
          if (listeners) {
            listeners.forEach((fn) => fn(cheerData));
          }
        });
      }

      // 3. Cheers feed update
      if (Array.isArray(msg.cheersFeed)) {
        this.cachedCheersFeed = msg.cheersFeed;
        this.cheerFeedListeners.forEach((fn) => fn(msg.cheersFeed!));
      }

      // 4. Reactions
      if (msg.reactions) {
        this.cachedReactions = msg.reactions;
      }
    }
  }

  public send(payload: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(payload));
        return true;
      } catch (e) {
        console.warn('[RealtimeWs] Send error:', e);
        return false;
      }
    }
    return false;
  }

  // -------------------------------------------------------------
  // Subscription handlers for matches
  // -------------------------------------------------------------
  public subscribeMatches(callback: Listener<MatchItem[]>): () => void {
    this.matchListeners.add(callback);
    if (this.cachedMatches) {
      callback(this.cachedMatches);
    }
    return () => {
      this.matchListeners.delete(callback);
    };
  }

  // -------------------------------------------------------------
  // Subscription handlers for cheers
  // -------------------------------------------------------------
  public subscribeCheers(matchId: string, callback: Listener<CheerCount>): () => void {
    if (!this.cheerListeners.has(matchId)) {
      this.cheerListeners.set(matchId, new Set());
    }
    this.cheerListeners.get(matchId)!.add(callback);

    const cached = this.cachedCheers.get(matchId);
    if (cached) {
      callback(cached);
    }

    return () => {
      const set = this.cheerListeners.get(matchId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.cheerListeners.delete(matchId);
        }
      }
    };
  }

  // -------------------------------------------------------------
  // Subscription handlers for cheers feed
  // -------------------------------------------------------------
  public subscribeCheersFeed(callback: Listener<CheerMessageItem[]>): () => void {
    this.cheerFeedListeners.add(callback);
    if (this.cachedCheersFeed.length > 0) {
      callback(this.cachedCheersFeed);
    }
    return () => {
      this.cheerFeedListeners.delete(callback);
    };
  }

  // -------------------------------------------------------------
  // Optimistic Cheer Event Sending
  // -------------------------------------------------------------
  public sendCheer(matchId: string, team: 'home' | 'away', emoji: string): boolean {
    // 1. Optimistic local update for instantaneous UX
    const cached = this.cachedCheers.get(matchId) || { matchId, homeCheers: 0, awayCheers: 0, lastEmoji: emoji };
    if (team === 'home') {
      cached.homeCheers += 1;
    } else {
      cached.awayCheers += 1;
    }
    cached.lastEmoji = emoji;
    this.cachedCheers.set(matchId, cached);

    const listeners = this.cheerListeners.get(matchId);
    if (listeners) {
      listeners.forEach((fn) => fn({ ...cached }));
    }

    // 2. Dispatch via WebSocket to server
    const sent = this.send({
      action: 'cheer',
      matchId,
      team,
      emoji
    });

    return sent;
  }

  public sendReaction(reactionType: 'fire' | 'clap' | 'heart' | 'cheer'): boolean {
    if (this.cachedReactions[reactionType] !== undefined) {
      this.cachedReactions[reactionType] += 1;
    }
    return this.send({
      action: 'reaction',
      reactionType
    });
  }
}

export const realtimeWsClient = new RealtimeWsClient();
