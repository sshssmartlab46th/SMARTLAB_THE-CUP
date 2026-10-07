import { MatchItem, CheerCount, CheerMessageItem, LiveReactionType } from '../types';

type Listener<T> = (data: T) => void;

interface BatchMessage {
  type: 'INITIAL_STATE' | 'FULL_SYNC' | 'BATCH_UPDATE' | 'pong';
  timestamp?: number;
  matches?: MatchItem[];
  cheers?: Record<string, CheerCount>;
  cheersFeed?: CheerMessageItem[];
  reactions?: Record<string, any>;
}

function getDefaultReactions(): Record<LiveReactionType, number> {
  return {
    fire: 0,
    clap: 0,
    heart: 0,
    cheer: 0,
    trophy: 0,
    sparkles: 0,
    star: 0
  };
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
  private consecutiveFailures = 0;

  // Cached state
  private cachedMatches: MatchItem[] | null = null;
  private cachedCheers = new Map<string, CheerCount>();
  private cachedCheersFeed: CheerMessageItem[] = [];
  private cachedReactions = new Map<string, Record<LiveReactionType, number>>();

  // Listeners
  private matchListeners = new Set<Listener<MatchItem[]>>();
  private cheerListeners = new Map<string, Set<Listener<CheerCount>>>();
  private cheerFeedListeners = new Set<Listener<CheerMessageItem[]>>();
  private reactionListeners = new Map<string, Set<Listener<Record<LiveReactionType, number>>>>();
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

  public isVercelEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return hostname.includes('vercel.app') || hostname.includes('webcontainer') || hostname.includes('local-credentialless');
  }

  public getWsUrl(): string {
    const envUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WS_URL)
      || (typeof process !== 'undefined' && process.env?.VITE_WS_URL);
    if (envUrl) {
      return envUrl;
    }
    if (typeof window === 'undefined') return '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
  }

  public initConnection() {
    if (typeof window === 'undefined') return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const customWsUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WS_URL)
      || (typeof process !== 'undefined' && process.env?.VITE_WS_URL);

    if (!customWsUrl && this.isVercelEnvironment()) {
      console.warn('[RealtimeWs] VITE_WS_URL is not configured for Vercel environment. Set VITE_WS_URL to connect to dedicated WebSocket server and prevent Firestore read quota exhaustion.');
      this.hasFailedOnce = true;
      this.notifyStatus(false);
      return;
    }

    const wsUrl = this.getWsUrl();

    try {
      this.socket = new WebSocket(wsUrl);

      // Connection timeout fallback (e.g. if server doesn't support WS)
      const connectTimeout = setTimeout(() => {
        if (!this.isConnected && this.socket?.readyState !== WebSocket.OPEN) {
          this.consecutiveFailures++;
          this.hasFailedOnce = true;
          this.notifyStatus(false);
        }
      }, 3000);

      this.socket.onopen = () => {
        clearTimeout(connectTimeout);
        this.consecutiveFailures = 0;
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
        } catch {
          // Ignore parse errors on ping/pong or binary frames
        }
      };

      this.socket.onclose = () => {
        clearInterval(this.pingInterval);
        this.notifyStatus(false);
        this.hasFailedOnce = true;
        this.consecutiveFailures++;
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.consecutiveFailures++;
        this.hasFailedOnce = true;
        this.notifyStatus(false);
      };
    } catch {
      this.consecutiveFailures++;
      this.hasFailedOnce = true;
      this.notifyStatus(false);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimeout);
    // When socket is repeatedly unavailable, quiet down retry frequency to 60s
    const delay = this.consecutiveFailures > 3 ? 60000 : this.reconnectDelay;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.initConnection();
    }, delay);
  }

  private handleIncomingMessage(msg: BatchMessage) {
    if (msg.type === 'INITIAL_STATE' || msg.type === 'FULL_SYNC' || msg.type === 'BATCH_UPDATE') {
      // 1. Matches update (Full sync vs Incremental diff)
      if (Array.isArray(msg.matches)) {
        if (msg.type === 'INITIAL_STATE' || msg.type === 'FULL_SYNC' || !this.cachedMatches) {
          this.cachedMatches = msg.matches.filter((m: any) => !m._deleted);
        } else {
          // BATCH_UPDATE diff merging logic
          const existingMap = new Map<string, MatchItem>(this.cachedMatches.map((m) => [m.id, m]));
          msg.matches.forEach((item: any) => {
            if (item._deleted) {
              existingMap.delete(item.id);
            } else if (item.id) {
              existingMap.set(item.id, item as MatchItem);
            }
          });
          this.cachedMatches = Array.from(existingMap.values());
        }
        this.matchListeners.forEach((fn) => fn(this.cachedMatches!));
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
        Object.entries(msg.reactions).forEach(([key, val]) => {
          if (typeof val === 'number') {
            const globalReactions = this.cachedReactions.get('global') || getDefaultReactions();
            (globalReactions as any)[key] = val;
            this.cachedReactions.set('global', globalReactions);
            const listeners = this.reactionListeners.get('global');
            if (listeners) listeners.forEach((fn) => fn({ ...globalReactions }));
          } else if (val && typeof val === 'object') {
            const matchId = key;
            const matchReactions = { ...getDefaultReactions(), ...val };
            this.cachedReactions.set(matchId, matchReactions);
            const listeners = this.reactionListeners.get(matchId);
            if (listeners) listeners.forEach((fn) => fn({ ...matchReactions }));
          }
        });
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
  // Subscription handlers for reactions
  // -------------------------------------------------------------
  public subscribeReactions(matchId: string, callback: Listener<Record<LiveReactionType, number>>): () => void {
    const key = matchId || 'global';
    if (!this.reactionListeners.has(key)) {
      this.reactionListeners.set(key, new Set());
    }
    this.reactionListeners.get(key)!.add(callback);

    const cached = this.cachedReactions.get(key);
    if (cached) {
      callback({ ...cached });
    } else {
      callback(getDefaultReactions());
    }

    return () => {
      const set = this.reactionListeners.get(key);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.reactionListeners.delete(key);
        }
      }
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

  public sendReaction(matchIdOrReactionType: string, reactionType?: LiveReactionType): boolean {
    let matchId: string;
    let type: LiveReactionType;

    if (reactionType) {
      matchId = matchIdOrReactionType;
      type = reactionType;
    } else {
      matchId = 'global';
      type = matchIdOrReactionType as LiveReactionType;
    }

    const cached = this.cachedReactions.get(matchId) || getDefaultReactions();
    if (cached[type] !== undefined) {
      cached[type] += 1;
    }
    this.cachedReactions.set(matchId, cached);

    const listeners = this.reactionListeners.get(matchId);
    if (listeners) {
      listeners.forEach((fn) => fn({ ...cached }));
    }

    return this.send({
      action: 'reaction',
      matchId,
      reactionType: type
    });
  }
}

export const realtimeWsClient = new RealtimeWsClient();
