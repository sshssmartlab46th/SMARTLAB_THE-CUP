import { useState, useEffect } from 'react';
import { MatchItem } from '../types';

/**
 * Formats seconds into MM:SS format (e.g., 65 -> "01:05")
 */
export function formatElapsedSeconds(seconds?: number | null): string {
  const safeSec = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(safeSec / 60);
  const s = safeSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Computes exact live elapsed seconds based on server-authoritative timer state.
 * Prevents time drift on client UI.
 */
export function computeLiveElapsedSeconds(match?: Partial<MatchItem> | null): number {
  if (!match) return 0;
  const base = Number(match.elapsedSeconds) || 0;

  if (match.status === 'LIVE' && match.timerRunning && match.lastTimerStartedAt) {
    const now = Date.now();
    const diffSec = Math.floor((now - match.lastTimerStartedAt) / 1000);
    return Math.max(0, base + diffSec);
  }

  return base;
}

/**
 * React hook that returns live updating elapsed seconds for smooth client display.
 * Updates every 1 second when `timerRunning` is true.
 */
export function useLiveMatchTimer(match?: Partial<MatchItem> | null): number {
  const [elapsed, setElapsed] = useState<number>(() => computeLiveElapsedSeconds(match));

  useEffect(() => {
    setElapsed(computeLiveElapsedSeconds(match));

    if (!match?.timerRunning || match?.status !== 'LIVE' || !match?.lastTimerStartedAt) {
      return;
    }

    const intervalId = setInterval(() => {
      setElapsed(computeLiveElapsedSeconds(match));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [
    match?.id,
    match?.status,
    match?.timerRunning,
    match?.elapsedSeconds,
    match?.lastTimerStartedAt
  ]);

  return elapsed;
}
