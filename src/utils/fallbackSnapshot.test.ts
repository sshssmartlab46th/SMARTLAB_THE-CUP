import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveFallbackSnapshot,
  loadFallbackSnapshot,
  clearFallbackSnapshot,
  formatSnapshotTime
} from './fallbackSnapshot';
import { MatchItem, NoticeItem, ClassStandingItem } from '../types';

// In-memory localStorage mock for node test environment
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
};

describe('fallbackSnapshot utility', () => {
  beforeEach(() => {
    const mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', { localStorage: mockStorage });
  });

  const mockMatches: MatchItem[] = [
    {
      id: 'match-1',
      sport: 'soccer',
      matchType: 'tournament',
      title: '축구 8강 1경기',
      round: '8강 1경기',
      homeTeam: '1-1반',
      awayTeam: '1-2반',
      homeClass: '101',
      awayClass: '102',
      homeScore: 2,
      awayScore: 1,
      status: 'FINISHED',
      period: '경기 종료',
      elapsedSeconds: 0,
      timerRunning: false,
      startTime: '2026-05-20T10:00:00Z',
      court: '대운동장 A',
      events: [],
      updatedAt: '2026-05-20T11:00:00Z'
    }
  ];

  const mockNotices: NoticeItem[] = [
    {
      id: 'notice-1',
      title: '우천 시 경기 변경 안내',
      content: '대운동장에서 체육관으로 변경됩니다.',
      type: 'global',
      authorName: '관리자',
      authorRole: 'admin',
      authorId: 'admin',
      important: true,
      createdAt: '2026-05-20'
    }
  ];

  const mockStandings: ClassStandingItem[] = [
    {
      id: '101',
      classLabel: '1-1반',
      grade: '1',
      classNum: '1',
      rank: 1,
      points: 500,
      goldCount: 1,
      silverCount: 0,
      bronzeCount: 0
    }
  ];

  it('saves and loads a valid snapshot to/from localStorage', () => {
    const saved = saveFallbackSnapshot({
      matches: mockMatches,
      notices: mockNotices,
      standings: mockStandings
    });

    expect(saved).not.toBeNull();
    expect(saved?.matches).toHaveLength(1);
    expect(saved?.notices).toHaveLength(1);
    expect(saved?.standings).toHaveLength(1);

    const loaded = loadFallbackSnapshot();
    expect(loaded).not.toBeNull();
    expect(loaded?.matches[0].id).toBe('match-1');
    expect(loaded?.notices[0].title).toBe('우천 시 경기 변경 안내');
    expect(loaded?.standings[0].points).toBe(500);
  });

  it('partially updates existing snapshot if new data is provided', () => {
    saveFallbackSnapshot({
      matches: mockMatches,
      notices: mockNotices,
      standings: mockStandings
    });

    const updatedMatches: MatchItem[] = [
      ...mockMatches,
      {
        id: 'match-2',
        sport: 'basketball',
        matchType: 'tournament',
        title: '농구 8강 2경기',
        round: '8강 2경기',
        homeTeam: '1-3반',
        awayTeam: '1-4반',
        homeClass: '103',
        awayClass: '104',
        homeScore: 30,
        awayScore: 28,
        status: 'FINISHED',
        period: '경기 종료',
        elapsedSeconds: 0,
        timerRunning: false,
        startTime: '2026-05-20T11:00:00Z',
        court: '체육관',
        events: [],
        updatedAt: '2026-05-20T12:00:00Z'
      }
    ];

    saveFallbackSnapshot({ matches: updatedMatches });

    const loaded = loadFallbackSnapshot();
    expect(loaded?.matches).toHaveLength(2);
    expect(loaded?.notices).toHaveLength(1); // retained previous notices
    expect(loaded?.standings).toHaveLength(1); // retained previous standings
  });

  it('clears fallback snapshot correctly', () => {
    saveFallbackSnapshot({ matches: mockMatches });
    expect(loadFallbackSnapshot()).not.toBeNull();

    clearFallbackSnapshot();
    expect(loadFallbackSnapshot()).toBeNull();
  });

  it('handles corrupted JSON gracefully without crashing', () => {
    localStorage.setItem('sangsan_fallback_snapshot', '{ invalid json ...');
    const loaded = loadFallbackSnapshot();
    expect(loaded).toBeNull();
  });

  it('formats timestamp into user-friendly string', () => {
    const ts = new Date('2026-05-20T14:30:00').getTime();
    const formatted = formatSnapshotTime(ts);
    expect(formatted).toContain('5월 20일');
    expect(formatted).toContain('14:30');
  });
});
