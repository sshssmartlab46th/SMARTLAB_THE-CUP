import { useState, useEffect, useCallback } from 'react';
import { saveFallbackSnapshot, loadFallbackSnapshot, FallbackSnapshotData } from '../utils/fallbackSnapshot';
import { realtimeWsClient } from '../services/realtimeWsClient';
import { MatchItem, NoticeItem, ClassStandingItem } from '../types';

export function useOfflineFallback(data: {
  matches: MatchItem[];
  notices: NoticeItem[];
  standings: ClassStandingItem[];
}) {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isWsConnected, setIsWsConnected] = useState<boolean>(() =>
    realtimeWsClient.isWsActive()
  );
  const [isManualFallback, setIsManualFallback] = useState<boolean>(false);
  const [snapshot, setSnapshot] = useState<FallbackSnapshotData | null>(() =>
    loadFallbackSnapshot()
  );

  // Sync state to snapshot when new data arrives
  useEffect(() => {
    if (data.matches.length > 0 || data.notices.length > 0 || data.standings.length > 0) {
      const saved = saveFallbackSnapshot({
        matches: data.matches,
        notices: data.notices,
        standings: data.standings
      });
      if (saved) {
        setSnapshot(saved);
      }
    }
  }, [data.matches, data.notices, data.standings]);

  // Handle online/offline events and WS connection status updates
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubWs = realtimeWsClient.subscribeStatus((connected) => {
      setIsWsConnected(connected);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubWs();
    };
  }, []);

  const isFallbackActive = isManualFallback || !isOnline;

  const retryConnection = useCallback(() => {
    realtimeWsClient.reconnectImmediately();
    const currentSnapshot = loadFallbackSnapshot();
    if (currentSnapshot) {
      setSnapshot(currentSnapshot);
    }
  }, []);

  const toggleManualFallback = useCallback(() => {
    setIsManualFallback((prev) => !prev);
  }, []);

  return {
    isOnline,
    isWsConnected,
    isManualFallback,
    isFallbackActive,
    snapshot,
    retryConnection,
    toggleManualFallback,
    setIsManualFallback
  };
}
