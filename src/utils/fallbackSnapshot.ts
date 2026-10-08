import { MatchItem, NoticeItem, ClassStandingItem } from '../types';

export interface FallbackSnapshotData {
  matches: MatchItem[];
  notices: NoticeItem[];
  standings: ClassStandingItem[];
  timestamp: number;
  lastUpdatedLabel: string;
}

const SNAPSHOT_STORAGE_KEY = 'sangsan_fallback_snapshot';

/**
 * Formats a timestamp into a user-friendly Korean date-time string.
 */
export function formatSnapshotTime(ts: number): string {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '알 수 없음';
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${month}월 ${date}일 ${hours}:${minutes}:${seconds}`;
  } catch {
    return '알 수 없음';
  }
}

/**
 * Saves or updates the current app state snapshot in localStorage for offline fallback display.
 */
export function saveFallbackSnapshot(data: {
  matches?: MatchItem[];
  notices?: NoticeItem[];
  standings?: ClassStandingItem[];
}): FallbackSnapshotData | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const existing = loadFallbackSnapshot();
    const now = Date.now();

    const updatedSnapshot: FallbackSnapshotData = {
      matches: data.matches ?? existing?.matches ?? [],
      notices: data.notices ?? existing?.notices ?? [],
      standings: data.standings ?? existing?.standings ?? [],
      timestamp: now,
      lastUpdatedLabel: formatSnapshotTime(now)
    };

    // Only save if there is actually some content
    if (
      updatedSnapshot.matches.length > 0 ||
      updatedSnapshot.notices.length > 0 ||
      updatedSnapshot.standings.length > 0
    ) {
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(updatedSnapshot));
    }

    return updatedSnapshot;
  } catch (error) {
    console.warn('[FallbackSnapshot] Failed to save snapshot to localStorage:', error);
    return null;
  }
}

/**
 * Loads the last persisted app state snapshot from localStorage.
 */
export function loadFallbackSnapshot(): FallbackSnapshotData | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FallbackSnapshotData;
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      matches: Array.isArray(parsed.matches) ? parsed.matches : [],
      notices: Array.isArray(parsed.notices) ? parsed.notices : [],
      standings: Array.isArray(parsed.standings) ? parsed.standings : [],
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
      lastUpdatedLabel: parsed.lastUpdatedLabel || formatSnapshotTime(parsed.timestamp || Date.now())
    };
  } catch (error) {
    console.warn('[FallbackSnapshot] Failed to load or parse snapshot from localStorage:', error);
    return null;
  }
}

/**
 * Clears the cached fallback snapshot from localStorage.
 */
export function clearFallbackSnapshot(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(SNAPSHOT_STORAGE_KEY);
    } catch {
      // quiet catch
    }
  }
}
